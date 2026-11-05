import {
  getCategories,
  getAreas,
  getRandomMeals,
  searchMeals,
  filterByCategory,
  filterByArea,
} from "./api.js";
import {
  loadingSpinner,
  emptyState,
  errorState,
  areaChip,
  activeChipClass,
  normalChipClass,
  categoryCard,
  mealCard,
} from "./ui/components.js";

// ================= Variables =================
let categories = [];
let meals = [];
let showAllCategories = false;
let isList = false;

// الفلتر الحالي: all أو category أو area أو search
let active = { type: "all", value: "" };

let requestId = 0;
let searchTimer = null;

// بنستخدمها لما نضغط على وجبة
let onMealClick = null;

export function setMealClickHandler(handler) {
  onMealClick = handler;
}

// ================= Elements =================
const categoriesGrid = document.getElementById("categories-grid");
const areasContainer = document.getElementById("areas-container");
const recipesGrid = document.getElementById("recipes-grid");
const recipesCount = document.getElementById("recipes-count");
const searchInput = document.getElementById("search-input");
const gridBtn = document.getElementById("grid-view-btn");
const listBtn = document.getElementById("list-view-btn");
const viewAllBtn = document.querySelector("#meal-categories-section button");

// ================= Start =================
export async function startMeals() {
  addEvents();

  await Promise.all([loadCategories(), loadAreas(), loadMeals()]);
}

// ================= Events =================
function addEvents() {
  // الضغط على category
  categoriesGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".category-card");
    if (!card) return;
    selectFilter("category", card.dataset.category);
  });

  // الضغط على area
  areasContainer.addEventListener("click", (event) => {
    const chip = event.target.closest(".area-chip");
    if (!chip) return;

    const area = chip.dataset.area;
    if (area === "") {
      selectFilter("all", "");
    } else {
      selectFilter("area", area);
    }
  });

  // الضغط على وجبة أو زرار Try Again
  recipesGrid.addEventListener("click", (event) => {
    const retryBtn = event.target.closest(".retry-btn");
    if (retryBtn) {
      loadMeals();
      return;
    }

    const card = event.target.closest(".recipe-card");
    if (card && onMealClick) {
      onMealClick(card.dataset.mealId);
    }
  });

  // البحث (بنستنى 500ms بعد آخر حرف)
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      search();
    }, 500);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      clearTimeout(searchTimer);
      search();
    }
  });

  // Grid / List
  gridBtn.addEventListener("click", () => {
    setView(false);
  });
  listBtn.addEventListener("click", () => {
    setView(true);
  });

  // View All
  viewAllBtn.addEventListener("click", () => {
    showAllCategories = !showAllCategories;
    renderCategories();
  });
}

// ================= Categories =================
async function loadCategories() {
  try {
    categories = await getCategories();
    renderCategories();
  } catch (error) {
    console.log(error);
    categoriesGrid.innerHTML =
      '<p class="text-center text-gray-500 py-4" style="grid-column: 1 / -1;">Could not load categories</p>';
  }
}

function renderCategories() {
  let list = categories;

  if (!showAllCategories) {
    list = categories.slice(0, 12);
  }

  let html = "";
  for (let i = 0; i < list.length; i++) {
    html += categoryCard(list[i]);
  }
  categoriesGrid.innerHTML = html;

  if (showAllCategories) {
    viewAllBtn.innerHTML =
      'Show Less <i class="fa-solid fa-chevron-up text-xs"></i>';
  } else {
    viewAllBtn.innerHTML =
      'View All <i class="fa-solid fa-chevron-right text-xs"></i>';
  }

  updateActiveStyles();
}

// ================= Areas =================
async function loadAreas() {
  try {
    const areas = await getAreas();

    // نشيل الأسماء المكررة (زي Dominican و Congolese)
    const names = [];
    for (let i = 0; i < areas.length; i++) {
      if (!names.includes(areas[i].name)) {
        names.push(areas[i].name);
      }
    }

    let html = areaChip("", "All Recipes");
    for (let i = 0; i < names.length; i++) {
      html += areaChip(names[i], names[i]);
    }
    areasContainer.innerHTML = html;

    updateActiveStyles();
  } catch (error) {
    console.log(error);
    areasContainer.innerHTML = areaChip("", "All Recipes");
    updateActiveStyles();
  }
}

// ================= Meals =================
async function loadMeals() {
  requestId++;
  const myId = requestId;

  recipesGrid.innerHTML = loadingSpinner();
  recipesCount.textContent = "Loading recipes...";

  try {
    let result = [];

    if (active.type === "category") {
      result = await filterByCategory(active.value);
    } else if (active.type === "area") {
      result = await filterByArea(active.value);
    } else if (active.type === "search") {
      result = await searchMeals(active.value);
    } else {
      result = await getRandomMeals(25);
    }

    // لو في طلب أحدث بعد ده، نتجاهل الرد القديم
    if (myId !== requestId) return;

    meals = result || [];
    renderMeals();
  } catch (error) {
    if (myId !== requestId) return;

    console.log(error);
    meals = [];
    recipesGrid.innerHTML = errorState("Could not load recipes");
    recipesCount.textContent = "Showing 0 recipes";
  }
}

function getCountText() {
  const count = meals.length;

  if (active.type === "category" || active.type === "area") {
    return "Showing " + count + " " + active.value + " recipes";
  }

  return "Showing " + count + " recipes";
}

function renderMeals() {
  if (meals.length === 0) {
    recipesGrid.innerHTML = emptyState();
    recipesCount.textContent = "Showing 0 recipes";
    return;
  }

  let html = "";
  for (let i = 0; i < meals.length; i++) {
    html += mealCard(meals[i], isList);
  }
  recipesGrid.innerHTML = html;
  recipesCount.textContent = getCountText();
}

// ================= Filters =================
function selectFilter(type, value) {
  active = { type: type, value: value };
  searchInput.value = "";
  updateActiveStyles();
  loadMeals();
}

function search() {
  const text = searchInput.value.trim();

  if (text === "") {
    active = { type: "all", value: "" };
  } else {
    active = { type: "search", value: text };
  }

  updateActiveStyles();
  loadMeals();
}

function updateActiveStyles() {
  const chips = areasContainer.querySelectorAll(".area-chip");
  for (let i = 0; i < chips.length; i++) {
    const area = chips[i].dataset.area;
    let isActive = false;

    if (area === "" && active.type === "all") {
      isActive = true;
    }
    if (area !== "" && active.type === "area" && area === active.value) {
      isActive = true;
    }

    chips[i].className = isActive ? activeChipClass : normalChipClass;
  }
}

// ================= Grid / List =================
function setView(listMode) {
  isList = listMode;

  if (isList) {
    recipesGrid.className = "grid grid-cols-2 gap-6";
    listBtn.className = "px-3 py-1.5 bg-white rounded-md shadow-sm";
    gridBtn.className = "px-3 py-1.5";
    listBtn.querySelector("i").className = "fa-solid fa-list text-gray-700";
    gridBtn.querySelector("i").className = "fa-solid fa-table-cells text-gray-500";
  } else {
    recipesGrid.className = "grid grid-cols-4 gap-5";
    gridBtn.className = "px-3 py-1.5 bg-white rounded-md shadow-sm";
    listBtn.className = "px-3 py-1.5";
    gridBtn.querySelector("i").className = "fa-solid fa-table-cells text-gray-700";
    listBtn.querySelector("i").className = "fa-solid fa-list text-gray-500";
  }

  if (meals.length > 0) {
    renderMeals();
  }
}