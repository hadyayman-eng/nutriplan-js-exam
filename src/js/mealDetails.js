import { getMealById, analyzeNutrition } from "./api.js";
import { escapeHtml, loadingSpinner } from "./ui/components.js";

const listSections = [
  "search-filters-section",
  "meal-categories-section",
  "all-recipes-section",
];

const detailsSection = document.getElementById("meal-details");

// عشان لو فتحت وجبة تانية قبل ما الأولى تخلص تحميل
let currentMealId = "";

// ================= Show / Hide =================
const headerTitle = document.querySelector("#header h1");
const headerSubtitle = document.querySelector("#header p");

function showDetailsPage() {
  for (let i = 0; i < listSections.length; i++) {
    document.getElementById(listSections[i]).style.display = "none";
  }
  detailsSection.style.display = "block";

  headerTitle.textContent = "Recipe Details";
  headerSubtitle.textContent = "View full recipe information and nutrition facts";

  window.scrollTo(0, 0);
}

export function closeMealDetails() {
  if (detailsSection.style.display !== "block") return;

  currentMealId = "";
  detailsSection.style.display = "none";

  for (let i = 0; i < listSections.length; i++) {
    document.getElementById(listSections[i]).style.display = "block";
  }

  headerTitle.textContent = "Meals & Recipes";
  headerSubtitle.textContent = "Discover delicious and nutritious recipes tailored for you";

  window.scrollTo(0, 0);
}

// ================= Open Meal =================
export async function openMeal(id) {
  currentMealId = id;
  showDetailsPage();

  detailsSection.innerHTML = `
    <div class="max-w-7xl mx-auto">
      ${loadingSpinner()}
    </div>
  `;

  try {
    const meal = await getMealById(id);

    // لو المستخدم فتح وجبة تانية أو رجع، نتجاهل
    if (currentMealId !== id) return;

    detailsSection.innerHTML = mealDetailsHtml(meal);
    loadNutrition(meal);
  } catch (error) {
    if (currentMealId !== id) return;

    console.log(error);
    detailsSection.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <button
          id="back-to-meals-btn"
          class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors"
        >
          <i class="fa-solid fa-arrow-left"></i>
          <span>Back to Recipes</span>
        </button>
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <i class="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
          </div>
          <p class="text-gray-500 text-lg">Could not load this recipe</p>
          <button
            class="retry-meal-btn mt-4 px-5 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all"
            data-meal-id="${escapeHtml(id)}"
          >
            Try Again
          </button>
        </div>
      </div>
    `;
  }
}

// ================= Nutrition =================
let currentMeal = null;
let currentNutrition = null;

export function getCurrentMealData() {
  return { meal: currentMeal, nutrition: currentNutrition };
}

// صف واحد: اسم + قيمة + progress bar
function nutrientRow(label, dotClass, barClass, value, max) {
  const rounded = Math.round(value);

  let percent = Math.round((value / max) * 100);
  if (percent > 100) percent = 100;

  return `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full ${dotClass}"></div>
        <span class="text-gray-700">${label}</span>
      </div>
      <span class="font-bold text-gray-900">${rounded}g</span>
    </div>
    <div class="w-full bg-gray-100 rounded-full h-2">
      <div class="${barClass} h-2 rounded-full" style="width: ${percent}%"></div>
    </div>
  `;
}

function nutritionHtml(data, warnings) {
  const perServing = data.perServing;
  const calories = Math.round(perServing.calories);
  const totalCalories = Math.round(data.totals.calories);

  let warningHtml = "";
  if (warnings && warnings.length > 0) {
    let names = [];
    for (let i = 0; i < warnings.length; i++) {
      names.push(warnings[i].ingredient || "");
    }
    warningHtml = `
      <p class="text-xs text-amber-600 mt-4">
        <i class="fa-solid fa-circle-info mr-1"></i>
        Not included in the calculation: ${escapeHtml(names.join(", "))}
      </p>
    `;
  }

  return `
    <p class="text-sm text-gray-500 mb-4">Per serving</p>

    <div class="text-center py-4 mb-4 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl">
      <p class="text-sm text-gray-600">Calories per serving</p>
      <p class="text-4xl font-bold text-emerald-600">${calories}</p>
      <p class="text-xs text-gray-500 mt-1">Total: ${totalCalories} cal</p>
    </div>

    <div class="space-y-4">
      ${nutrientRow("Protein", "bg-emerald-500", "bg-emerald-500", perServing.protein, 50)}
      ${nutrientRow("Carbs", "bg-blue-500", "bg-blue-500", perServing.carbs, 300)}
      ${nutrientRow("Fat", "bg-purple-500", "bg-purple-500", perServing.fat, 65)}
      ${nutrientRow("Fiber", "bg-orange-500", "bg-orange-500", perServing.fiber, 28)}
      ${nutrientRow("Sugar", "bg-pink-500", "bg-pink-500", perServing.sugar, 50)}
    </div>

    <div class="mt-6 pt-6 border-t border-gray-100">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Other Nutrients</h3>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Saturated Fat</span>
          <span class="font-medium">${Math.round(perServing.saturatedFat)}g</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Cholesterol</span>
          <span class="font-medium">${Math.round(perServing.cholesterol)}mg</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Sodium</span>
          <span class="font-medium">${Math.round(perServing.sodium)}mg</span>
        </div>
      </div>
    </div>

    ${warningHtml}
  `;
}

async function loadNutrition(meal) {
  const box = document.getElementById("nutrition-facts-container");

  // نجهز المكونات كنصوص زي: "2 medium Fennel"
  const ingredients = [];
  for (let i = 0; i < meal.ingredients.length; i++) {
    const item = meal.ingredients[i];
    ingredients.push((item.measure + " " + item.ingredient).trim());
  }

  try {
    const result = await analyzeNutrition(meal.name, ingredients);

    // لو المستخدم فتح وجبة تانية أو رجع، نتجاهل
    if (currentMealId !== meal.id) return;

    const data = result.data;
    if (!data || !data.perServing) {
      throw new Error("Nutrition data is missing");
    }

    // نحفظ الداتا عشان زرار Log This Meal
    currentMeal = meal;
    currentNutrition = data;

    box.innerHTML = nutritionHtml(data, result.warnings);

    // نحدث الهيرو (الـ servings والـ calories)
    document.getElementById("hero-servings").textContent =
      data.servings + " servings";
    document.getElementById("hero-calories").textContent =
      Math.round(data.perServing.calories) + " cal/serving";
  } catch (error) {
    if (currentMealId !== meal.id) return;

    console.log(error);
    box.innerHTML = `
      <p class="text-gray-500 text-sm">Could not load nutrition facts</p>
      <p class="text-xs text-gray-400 mt-2">Please try opening the recipe again</p>
    `;
  }
}

// ================= HTML =================
function getVideoEmbedUrl(url) {
  if (!url) return "";

  try {
    const link = new URL(url);

    if (link.hostname.includes("youtube.com")) {
      const id = link.searchParams.get("v");
      if (id) return "https://www.youtube.com/embed/" + id;
    }

    if (link.hostname.includes("youtu.be")) {
      const id = link.pathname.slice(1);
      if (id) return "https://www.youtube.com/embed/" + id;
    }
  } catch (error) {
    console.log(error);
  }

  return "";
}

function tagsHtml(meal) {
  let html = "";
  const tags = meal.tags || [];
  for (let i = 0; i < tags.length; i++) {
    html += `<span class="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">${escapeHtml(tags[i])}</span>`;
  }
  return html;
}

function ingredientsHtml(meal) {
  let html = "";
  const items = meal.ingredients || [];

  for (let i = 0; i < items.length; i++) {
    const measure = escapeHtml(items[i].measure || "");
    const name = escapeHtml(items[i].ingredient || "");

    let measureHtml = "";
    if (measure.trim() !== "") {
      measureHtml = `<span class="font-medium text-gray-900">${measure}</span> `;
    }

    html += `
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
        <input
          type="checkbox"
          class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300"
        />
        <span class="text-gray-700">${measureHtml}${name}</span>
      </div>
    `;
  }

  return html;
}

function instructionsHtml(meal) {
  let html = "";
  const steps = meal.instructions || [];
  let number = 0;

  for (let i = 0; i < steps.length; i++) {
    // نتجاهل الأسطر الفاضية أو الرموز زي ▢
    if (steps[i].trim().length < 2) continue;

    number++;
    html += `
      <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
        <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
          ${number}
        </div>
        <p class="text-gray-700 leading-relaxed pt-2">${escapeHtml(steps[i])}</p>
      </div>
    `;
  }

  return html;
}

function videoHtml(meal) {
  const embedUrl = getVideoEmbedUrl(meal.youtube);

  // لو مفيش فيديو نخفي القسم كله
  if (embedUrl === "") return "";

  return `
    <div class="bg-white rounded-2xl shadow-lg p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <i class="fa-solid fa-video text-red-500"></i>
        Video Tutorial
      </h2>
      <div class="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
        <iframe
          src="${embedUrl}"
          class="absolute inset-0 w-full h-full"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  `;
}

function mealDetailsHtml(meal) {
  const id = escapeHtml(meal.id);
  const name = escapeHtml(meal.name);
  const image = escapeHtml(meal.thumbnail || "");
  const category = escapeHtml(meal.category || "Meal");
  const area = escapeHtml(meal.area || "International");
  const count = (meal.ingredients || []).length;

  return `
    <div class="max-w-7xl mx-auto">
      <button
        id="back-to-meals-btn"
        class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors"
      >
        <i class="fa-solid fa-arrow-left"></i>
        <span>Back to Recipes</span>
      </button>

      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="relative h-80 md:h-96">
          <img src="${image}" alt="${name}" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-8">
            <div class="flex items-center gap-3 mb-3">
              <span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${category}</span>
              <span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${area}</span>
              ${tagsHtml(meal)}
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">${name}</h1>
            <div class="flex items-center gap-6 text-white/90">
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-clock"></i>
                <span>30 min</span>
              </span>
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-utensils"></i>
                <span id="hero-servings">-- servings</span>
              </span>
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-fire"></i>
                <span id="hero-calories">-- cal/serving</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 mb-8">
        <button
          id="log-meal-btn"
          class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          data-meal-id="${id}"
        >
          <i class="fa-solid fa-clipboard-list"></i>
          <span>Log This Meal</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-list-check text-emerald-600"></i>
              Ingredients
              <span class="text-sm font-normal text-gray-500 ml-auto">${count} items</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${ingredientsHtml(meal)}
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-shoe-prints text-emerald-600"></i>
              Instructions
            </h2>
            <div class="space-y-4">
              ${instructionsHtml(meal)}
            </div>
          </div>

          ${videoHtml(meal)}
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-chart-pie text-emerald-600"></i>
              Nutrition Facts
            </h2>
            <div id="nutrition-facts-container">
              ${loadingSpinner()}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ================= Events =================
export function startMealDetails() {
  detailsSection.addEventListener("click", (event) => {
    // زرار Back
    const backBtn = event.target.closest("#back-to-meals-btn");
    if (backBtn) {
      closeMealDetails();
      return;
    }

    // زرار Try Again لو الوجبة فشلت
    const retryBtn = event.target.closest(".retry-meal-btn");
    if (retryBtn) {
      openMeal(retryBtn.dataset.mealId);
    }
  });

  // لو ضغطت على أي تاب من الـ sidebar وانت في التفاصيل
  const links = document.querySelectorAll(".nav-link");
  for (let i = 0; i < links.length; i++) {
    links[i].addEventListener("click", closeMealDetails);
  }
}