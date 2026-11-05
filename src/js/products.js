import {
  searchProducts,
  getProductsByCategory,
  getProductByBarcode,
  getProductCategories,
} from "./api.js";
import { escapeHtml, loadingSpinner, errorState } from "./ui/components.js";
import { addFoodLogItem } from "./foodlog.js";

// ================= Elements =================
const searchInput = document.getElementById("product-search-input");
const searchBtn = document.getElementById("search-product-btn");
const barcodeInput = document.getElementById("barcode-input");
const lookupBtn = document.getElementById("lookup-barcode-btn");
const gradeButtons = document.querySelectorAll(".nutri-score-filter");
const categoriesBox = document.getElementById("product-categories");
const productsGrid = document.getElementById("products-grid");
const productsCount = document.getElementById("products-count");

// بنعمل مكان للـ Previous / Next تحت الـ grid
const pagination = document.createElement("div");
pagination.id = "products-pagination";
productsGrid.after(pagination);

// ================= State =================
let products = [];
let mode = { type: "none", value: "" }; // none أو search أو category أو barcode
let page = 1;
let totalPages = 1;
let total = 0;
let activeGrade = "";
let requestId = 0;

// ================= Colors & Icons =================
const gradeColors = {
  a: "#22c55e",
  b: "#84cc16",
  c: "#eab308",
  d: "#f97316",
  e: "#ef4444",
};

const novaColors = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#f97316",
  4: "#ef4444",
};

const categoryColors = [
  "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  "bg-blue-100 text-blue-700 hover:bg-blue-200",
  "bg-orange-100 text-orange-700 hover:bg-orange-200",
  "bg-purple-100 text-purple-700 hover:bg-purple-200",
  "bg-lime-100 text-lime-700 hover:bg-lime-200",
  "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  "bg-red-100 text-red-700 hover:bg-red-200",
  "bg-green-100 text-green-700 hover:bg-green-200",
];

const categoryIcons = {
  snacks: "fa-cookie",
  beverages: "fa-glass-water",
  dairies: "fa-cheese",
  cheeses: "fa-cheese",
  yogurts: "fa-bowl-food",
  chocolates: "fa-cookie-bite",
  biscuits: "fa-cookie",
  "ice-creams": "fa-ice-cream",
  "breakfast-cereals": "fa-wheat-awn",
  breads: "fa-bread-slice",
  waters: "fa-droplet",
  sodas: "fa-bottle-water",
  coffees: "fa-mug-hot",
  teas: "fa-mug-saucer",
  fruits: "fa-apple-whole",
  vegetables: "fa-carrot",
  meats: "fa-drumstick-bite",
  fishes: "fa-fish",
  "plant-based-foods": "fa-seedling",
  "chips-and-fries": "fa-burger",
  sauces: "fa-bottle-droplet",
  spreads: "fa-bowl-food",
  pastas: "fa-bowl-food",
  desserts: "fa-cake-candles",
};

// ================= Helpers =================
function num(value) {
  return Number(value) || 0;
}

function round1(value) {
  return Math.round(num(value) * 10) / 10;
}

// بعض المنتجات الـ calories فيها 0 والباقي موجود، فبنحسبها من الباقي
function getCalories(product) {
  const n = product.nutrients || {};

  if (num(n.calories) > 0) {
    return num(n.calories);
  }

  return num(n.protein) * 4 + num(n.carbs) * 4 + num(n.fat) * 9;
}

function hasNutrition(product) {
  return getCalories(product) > 0;
}

function boxHtml(icon, title, text) {
  return `
      <div class="flex flex-col items-center justify-center py-12 text-center" style="grid-column: 1 / -1;">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid ${icon} text-gray-400 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg">${title}</p>
      <p class="text-gray-400 text-sm mt-2">${text}</p>
    </div>
  `;
}

function showToast(title, text) {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: title,
    text: text,
    showConfirmButton: false,
    timer: 2500,
  });
}

// ================= Product Card =================
function gradeBadgeHtml(product) {
  const grade = (product.nutritionGrade || "").toLowerCase();
  const color = gradeColors[grade];

  if (!color) {
    return `<div class="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded uppercase" style="background-color: #9ca3af;">Nutri-Score N/A</div>`;
  }

  return `<div class="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded uppercase" style="background-color: ${color};">Nutri-Score ${grade}</div>`;
}

function novaBadgeHtml(product) {
  const color = novaColors[product.novaGroup];

  if (!color) return "";

  return `
    <div
      class="absolute top-2 right-2 text-white text-xs font-bold rounded-full flex items-center justify-center"
      style="background-color: ${color}; width: 24px; height: 24px;"
      title="NOVA ${product.novaGroup}"
    >${product.novaGroup}</div>
  `;
}

function productCard(product) {
  const barcode = escapeHtml(product.barcode);
  const name = escapeHtml(product.name || "Unnamed product");
  const brand = escapeHtml(product.brand || "Unknown brand");
  const n = product.nutrients || {};

  let imageHtml = `<div class="text-gray-300 text-4xl"><i class="fa-solid fa-image"></i></div>`;
  if (product.image) {
    imageHtml = `
      <img
        class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
        src="${escapeHtml(product.image)}"
        alt="${name}"
        loading="lazy"
        onerror="this.style.display='none'"
      />
    `;
  }

  let caloriesHtml = `<span><i class="fa-solid fa-fire mr-1"></i>No data</span>`;
  let nutritionHtml = `<p class="text-xs text-gray-400 text-center py-3">No nutrition data available</p>`;

  if (hasNutrition(product)) {
    caloriesHtml = `<span><i class="fa-solid fa-fire mr-1"></i>${Math.round(getCalories(product))} kcal/100g</span>`;
    nutritionHtml = `
      <div class="grid grid-cols-4 gap-1 text-center">
        <div class="bg-emerald-50 rounded p-1.5">
          <p class="text-xs font-bold text-emerald-700">${round1(n.protein)}g</p>
          <p class="text-[10px] text-gray-500">Protein</p>
        </div>
        <div class="bg-blue-50 rounded p-1.5">
          <p class="text-xs font-bold text-blue-700">${round1(n.carbs)}g</p>
          <p class="text-[10px] text-gray-500">Carbs</p>
        </div>
        <div class="bg-purple-50 rounded p-1.5">
          <p class="text-xs font-bold text-purple-700">${round1(n.fat)}g</p>
          <p class="text-[10px] text-gray-500">Fat</p>
        </div>
        <div class="bg-orange-50 rounded p-1.5">
          <p class="text-xs font-bold text-orange-700">${round1(n.sugar)}g</p>
          <p class="text-[10px] text-gray-500">Sugar</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-barcode="${barcode}">
      <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        ${imageHtml}
        ${gradeBadgeHtml(product)}
        ${novaBadgeHtml(product)}
      </div>
      <div class="p-4">
        <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${brand}</p>
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${name}</h3>
        <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
          ${caloriesHtml}
        </div>
        ${nutritionHtml}
      </div>
    </div>
  `;
}

// ================= Render =================
function getFilteredProducts() {
  if (activeGrade === "") return products;

  const list = [];
  for (let i = 0; i < products.length; i++) {
    if ((products[i].nutritionGrade || "").toLowerCase() === activeGrade) {
      list.push(products[i]);
    }
  }
  return list;
}

function renderPagination() {
  if (mode.type === "barcode" || mode.type === "none" || totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  const buttonClass =
    "px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all";
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  pagination.innerHTML = `
    <div class="flex items-center justify-center gap-4 mt-6">
      <button
        class="${buttonClass}"
        data-page="${page - 1}"
        ${prevDisabled ? "disabled" : ""}
        style="${prevDisabled ? "opacity: 0.5; cursor: not-allowed;" : ""}"
      >
        <i class="fa-solid fa-chevron-left mr-1"></i>Previous
      </button>
      <span class="text-sm text-gray-600">Page ${page} of ${totalPages}</span>
      <button
        class="${buttonClass}"
        data-page="${page + 1}"
        ${nextDisabled ? "disabled" : ""}
        style="${nextDisabled ? "opacity: 0.5; cursor: not-allowed;" : ""}"
      >
        Next<i class="fa-solid fa-chevron-right ml-1"></i>
      </button>
    </div>
  `;
}

function renderProducts() {
  const list = getFilteredProducts();

  // نص العداد
  if (products.length === 0) {
    productsCount.textContent = "No products found";
  } else if (activeGrade !== "") {
    productsCount.textContent =
      list.length +
      " of " +
      products.length +
      " products on this page match Nutri-Score " +
      activeGrade.toUpperCase();
  } else if (total > products.length) {
    productsCount.textContent =
      "Showing " + products.length + " of " + total + " products";
  } else {
    productsCount.textContent = "Showing " + products.length + " products";
  }

  // الحالات الفاضية
  if (products.length === 0) {
    if (mode.type === "barcode") {
      productsGrid.innerHTML = boxHtml(
        "fa-barcode",
        "Product not found",
        "No product matches this barcode"
      );
    } else {
      productsGrid.innerHTML = boxHtml(
        "fa-search",
        "No products found",
        "Try searching for something else"
      );
    }
    renderPagination();
    return;
  }

  if (list.length === 0) {
    productsGrid.innerHTML = boxHtml(
      "fa-filter",
      "No products match this Nutri-Score",
      "Try another grade or go to another page"
    );
    renderPagination();
    return;
  }

  let html = "";
  for (let i = 0; i < list.length; i++) {
    html += productCard(list[i]);
  }
  productsGrid.innerHTML = html;

  renderPagination();
}

function showStartMessage() {
  products = [];
  mode = { type: "none", value: "" };
  productsGrid.innerHTML = boxHtml(
    "fa-barcode",
    "Search for products",
    "Search by name, enter a barcode, or pick a category"
  );
  productsCount.textContent = "Search for products to see results";
  pagination.innerHTML = "";
}

// ================= Load =================
async function loadProducts() {
  requestId++;
  const myId = requestId;

  productsGrid.innerHTML = loadingSpinner();
  productsCount.textContent = "Loading products...";
  pagination.innerHTML = "";

  try {
    let data = null;

    if (mode.type === "search") {
      data = await searchProducts(mode.value, page);
    } else if (mode.type === "category") {
      data = await getProductsByCategory(mode.value, page);
    } else if (mode.type === "barcode") {
      const product = await getProductByBarcode(mode.value);

      if (product) {
        data = { results: [product], pagination: { total: 1, totalPages: 1 } };
      } else {
        data = { results: [], pagination: { total: 0, totalPages: 1 } };
      }
    }

    // لو في طلب أحدث بعد ده، نتجاهل الرد القديم
    if (myId !== requestId) return;

    const info = data.pagination || {};
    products = data.results || [];
    total = info.total || products.length;
    totalPages = info.totalPages || 1;

    renderProducts();
  } catch (error) {
    if (myId !== requestId) return;

    console.log(error);
    products = [];
    productsGrid.innerHTML = errorState("Could not load products");
    productsCount.textContent = "Could not load products";
    pagination.innerHTML = "";
  }
}

// ================= Categories =================
async function loadCategories() {
  try {
    const categories = await getProductCategories();

    let html = "";
    for (let i = 0; i < categories.length; i++) {
      const id = categories[i].id;
      const icon = categoryIcons[id] || "fa-utensils";
      const color = categoryColors[i % categoryColors.length];

      html += `
        <button
          class="product-category-btn px-4 py-2 ${color} rounded-lg text-sm font-medium whitespace-nowrap transition-all"
          data-category="${escapeHtml(id)}"
        >
          <i class="fa-solid ${icon} mr-1.5"></i>${escapeHtml(categories[i].name)}
        </button>
      `;
    }

    categoriesBox.innerHTML = html;
    updateCategoryStyles();
  } catch (error) {
    console.log(error);
    categoriesBox.innerHTML =
      '<p class="text-gray-500 text-sm">Could not load categories</p>';
  }
}

function updateCategoryStyles() {
  const buttons = categoriesBox.querySelectorAll(".product-category-btn");

  for (let i = 0; i < buttons.length; i++) {
    const isActive =
      mode.type === "category" && buttons[i].dataset.category === mode.value;

    buttons[i].style.boxShadow = isActive ? "0 0 0 2px #059669" : "";
  }
}

// ================= Nutri-Score Filter =================
function updateGradeButtons() {
  for (let i = 0; i < gradeButtons.length; i++) {
    const grade = gradeButtons[i].dataset.grade;

    if (grade === activeGrade) {
      if (grade === "") {
        gradeButtons[i].style.backgroundColor = "#059669";
      } else {
        gradeButtons[i].style.backgroundColor = gradeColors[grade];
      }
      gradeButtons[i].style.color = "#ffffff";
    } else {
      gradeButtons[i].style.backgroundColor = "";
      gradeButtons[i].style.color = "";
    }
  }
}

function setGrade(grade) {
  activeGrade = grade;
  updateGradeButtons();

  if (products.length > 0) {
    renderProducts();
  }
}

// ================= Actions =================
function searchByName() {
  const text = searchInput.value.trim();

  if (text === "") {
    Swal.fire({
      icon: "warning",
      title: "Enter a product name",
      text: "Type the name of a product to search.",
    });
    return;
  }

  mode = { type: "search", value: text };
  page = 1;
  activeGrade = "";
  barcodeInput.value = "";

  updateCategoryStyles();
  updateGradeButtons();
  loadProducts();
}

function lookupBarcode() {
  const barcode = barcodeInput.value.trim();

  if (barcode === "") {
    Swal.fire({
      icon: "warning",
      title: "Enter a barcode",
      text: "Type a barcode number to look it up.",
    });
    return;
  }

  if (!/^\d{8,14}$/.test(barcode)) {
    Swal.fire({
      icon: "warning",
      title: "Invalid barcode",
      text: "A barcode contains only numbers (8 to 14 digits).",
    });
    return;
  }

  mode = { type: "barcode", value: barcode };
  page = 1;
  activeGrade = "";
  searchInput.value = "";

  updateCategoryStyles();
  updateGradeButtons();
  loadProducts();
}

function selectCategory(id) {
  mode = { type: "category", value: id };
  page = 1;
  activeGrade = "";
  searchInput.value = "";
  barcodeInput.value = "";

  updateCategoryStyles();
  updateGradeButtons();
  loadProducts();
}

// ================= Product Details Window =================
function infoCell(label, value) {
  return `
    <div style="background: #f3f4f6; border-radius: 8px; padding: 8px;">
      <p style="font-weight: 700; font-size: 14px;">${value}</p>
      <p style="font-size: 12px; color: #6b7280;">${label}</p>
    </div>
  `;
}

function openProductModal(barcode) {
  let product = null;
  for (let i = 0; i < products.length; i++) {
    if (String(products[i].barcode) === String(barcode)) {
      product = products[i];
    }
  }
  if (!product) return;

  const n = product.nutrients || {};
  const name = escapeHtml(product.name || "Unnamed product");
  const brand = escapeHtml(product.brand || "Unknown brand");

  const imageOptions = {};
  if (product.image) {
    imageOptions.imageUrl = product.image;
    imageOptions.imageHeight = 140;
    imageOptions.imageAlt = product.name || "Product";
  }

  // لو مفيش بيانات تغذية مينفعش نضيفه
  if (!hasNutrition(product)) {
    Swal.fire({
      ...imageOptions,
      title: name,
      html: `
        <p style="color: #059669; font-weight: 600;">${brand}</p>
        <p style="margin-top: 12px; color: #6b7280;">
          No nutrition data is available for this product, so it can not be added to the Food Log.
        </p>
      `,
      showCloseButton: true,
      showConfirmButton: false,
    });
    return;
  }

  // Nutri-Score و NOVA
  const grade = (product.nutritionGrade || "").toLowerCase();
  let badges = "";
  if (gradeColors[grade]) {
    badges += `<span style="background: ${gradeColors[grade]}; color: #fff; padding: 2px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; margin: 0 4px;">Nutri-Score ${grade.toUpperCase()}</span>`;
  }
  if (novaColors[product.novaGroup]) {
    badges += `<span style="background: ${novaColors[product.novaGroup]}; color: #fff; padding: 2px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; margin: 0 4px;">NOVA ${product.novaGroup}</span>`;
  }

  Swal.fire({
    ...imageOptions,
    title: name,
    html: `
      <p style="color: #059669; font-weight: 600; margin-bottom: 8px;">${brand}</p>
      <div style="margin-bottom: 12px;">${badges}</div>
      <p style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Nutrition values per 100g</p>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
        ${infoCell("Calories", Math.round(getCalories(product)) + " kcal")}
        ${infoCell("Protein", round1(n.protein) + " g")}
        ${infoCell("Carbs", round1(n.carbs) + " g")}
        ${infoCell("Fat", round1(n.fat) + " g")}
        ${infoCell("Sugar", round1(n.sugar) + " g")}
        ${infoCell("Fiber", round1(n.fiber) + " g")}
      </div>
      <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Sodium: ${Math.round(num(n.sodium) * 1000)} mg</p>
      <div style="margin-top: 16px;">
        <label for="product-grams" style="font-weight: 600;">Amount (grams)</label><br>
        <input id="product-grams" type="number" min="1" value="100" class="swal2-input" style="width: 140px;">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Add to Food Log",
    confirmButtonColor: "#059669",
    focusConfirm: false,
    preConfirm: () => {
      const grams = Number(document.getElementById("product-grams").value);

      if (!(grams > 0)) {
        Swal.showValidationMessage("Please enter a valid amount");
        return false;
      }
      if (grams > 5000) {
        Swal.showValidationMessage("Amount is too large");
        return false;
      }

      return grams;
    },
  }).then((result) => {
    if (!result.isConfirmed) return;

    const grams = result.value;
    const factor = grams / 100;

    let note = grams + "g";
    if (product.brand) {
      note += " • " + product.brand;
    }

    addFoodLogItem({
      type: "product",
      name: product.name || "Unnamed product",
      image: product.image || "",
      note: note,
      calories: getCalories(product) * factor,
      protein: num(n.protein) * factor,
      carbs: num(n.carbs) * factor,
      fat: num(n.fat) * factor,
    });

    showToast("Added to Food Log!", product.name || "");
  });
}

// ================= Start =================
export function startProducts() {
  // زرار All يبدأ رمادي (والأخضر بيتحط لما يكون active)
  gradeButtons[0].className =
    "nutri-score-filter px-4 py-2 rounded-lg text-sm font-bold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200";

  // البحث بالاسم
  searchBtn.addEventListener("click", searchByName);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchByName();
    }
  });

  // البحث بالباركود
  lookupBtn.addEventListener("click", lookupBarcode);
  barcodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      lookupBarcode();
    }
  });

  // الـ categories
  categoriesBox.addEventListener("click", (event) => {
    const button = event.target.closest(".product-category-btn");
    if (!button) return;
    selectCategory(button.dataset.category);
  });

  // فلتر Nutri-Score
  for (let i = 0; i < gradeButtons.length; i++) {
    gradeButtons[i].addEventListener("click", () => {
      setGrade(gradeButtons[i].dataset.grade);
    });
  }

  // الضغط على منتج أو Try Again
  productsGrid.addEventListener("click", (event) => {
    const retryBtn = event.target.closest(".retry-btn");
    if (retryBtn) {
      loadProducts();
      return;
    }

    const card = event.target.closest(".product-card");
    if (card) {
      openProductModal(card.dataset.barcode);
    }
  });

  // Previous / Next
  pagination.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (!button) return;

    page = Number(button.dataset.page);
    loadProducts();
    window.scrollTo(0, 0);
  });

  showStartMessage();
  updateGradeButtons();
  loadCategories();
}