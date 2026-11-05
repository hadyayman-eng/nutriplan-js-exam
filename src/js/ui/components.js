// =========== Loading Spinner Design ============
/*
<div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
</div>
*/

// =========== Empty State Design ============
/*
<div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-search text-gray-400 text-2xl"></i>
    </div>
    <p class="text-gray-500 text-lg">No recipes found</p>
    <p class="text-gray-400 text-sm mt-2">Try searching for something else</p>
</div>
*/


export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// =========== Loading Spinner ============
export function loadingSpinner() {
  return `
    <div class="flex items-center justify-center py-12" style="grid-column: 1 / -1;">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  `;
}

// =========== Empty State ============
export function emptyState() {
  return `
    <div class="flex flex-col items-center justify-center py-12 text-center" style="grid-column: 1 / -1;">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-search text-gray-400 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg">No recipes found</p>
      <p class="text-gray-400 text-sm mt-2">Try searching for something else</p>
    </div>
  `;
}

// =========== Error State ============
export function errorState(message) {
  return `
    <div class="flex flex-col items-center justify-center py-12 text-center" style="grid-column: 1 / -1;">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg">${message}</p>
      <button class="retry-btn mt-4 px-5 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all">
        Try Again
      </button>
    </div>
  `;
}

// =========== Area Chips ============
export const activeChipClass =
  "area-chip px-4 py-2 bg-emerald-600 text-white rounded-full font-medium text-sm whitespace-nowrap hover:bg-emerald-700 transition-all";

export const normalChipClass =
  "area-chip px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm whitespace-nowrap hover:bg-gray-200 transition-all";

export function areaChip(name, label) {
  return `<button class="${normalChipClass}" data-area="${escapeHtml(name)}">${escapeHtml(label)}</button>`;
}

// =========== Category Cards ============
const colors = {
  red: { from: "#fef2f2", to: "#fee2e2", border: "#fecaca", icon1: "#f87171", icon2: "#ef4444" },
  orange: { from: "#fff7ed", to: "#ffedd5", border: "#fed7aa", icon1: "#fb923c", icon2: "#f97316" },
  pink: { from: "#fdf2f8", to: "#fce7f3", border: "#fbcfe8", icon1: "#f472b6", icon2: "#ec4899" },
  slate: { from: "#f8fafc", to: "#f1f5f9", border: "#e2e8f0", icon1: "#94a3b8", icon2: "#64748b" },
  blue: { from: "#f0f9ff", to: "#e0f2fe", border: "#bae6fd", icon1: "#38bdf8", icon2: "#0ea5e9" },
  green: { from: "#ecfdf5", to: "#d1fae5", border: "#a7f3d0", icon1: "#34d399", icon2: "#22c55e" },
  teal: { from: "#f0fdfa", to: "#ccfbf1", border: "#99f6e4", icon1: "#2dd4bf", icon2: "#14b8a6" },
  lime: { from: "#f7fee7", to: "#ecfccb", border: "#d9f99d", icon1: "#a3e635", icon2: "#84cc16" },
  yellow: { from: "#fefce8", to: "#fef9c3", border: "#fef08a", icon1: "#facc15", icon2: "#eab308" },
};

const categoryStyles = {
  Beef: { color: "red", icon: "fa-drumstick-bite" },
  Chicken: { color: "orange", icon: "fa-drumstick-bite" },
  Dessert: { color: "pink", icon: "fa-cake-candles" },
  Lamb: { color: "orange", icon: "fa-drumstick-bite" },
  Miscellaneous: { color: "slate", icon: "fa-bowl-rice" },
  Pasta: { color: "orange", icon: "fa-bowl-food" },
  Pork: { color: "red", icon: "fa-bacon" },
  Seafood: { color: "blue", icon: "fa-fish" },
  Side: { color: "green", icon: "fa-bowl-rice" },
  Starter: { color: "teal", icon: "fa-utensils" },
  Vegan: { color: "green", icon: "fa-leaf" },
  Vegetarian: { color: "lime", icon: "fa-seedling" },
  Breakfast: { color: "yellow", icon: "fa-egg" },
  Goat: { color: "orange", icon: "fa-drumstick-bite" },
};

export function categoryCard(category) {
  const style = categoryStyles[category.name] || {
    color: "green",
    icon: "fa-utensils",
  };
  const c = colors[style.color];
  const name = escapeHtml(category.name);

  return `
    <div
      class="category-card rounded-xl p-3 border hover:shadow-md cursor-pointer transition-all group"
      style="background: linear-gradient(to bottom right, ${c.from}, ${c.to}); border-color: ${c.border};"
      data-category="${name}"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="text-white w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
          style="background: linear-gradient(to bottom right, ${c.icon1}, ${c.icon2});"
        >
          <i class="fa-solid ${style.icon}"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-900">${name}</h3>
        </div>
      </div>
    </div>
  `;
}

// =========== Meal Card ============
function getDescription(meal) {
  const steps = meal.instructions || [];

  // ناخد أول خطوة فيها كلام حقيقي
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].length > 20) {
      let text = steps[i];
      if (text.length > 100) {
        text = text.slice(0, 100).trim() + "...";
      }
      return text;
    }
  }

  return "Delicious recipe to try!";
}

export function mealCard(meal, isList) {
  const id = escapeHtml(meal.id);
  const name = escapeHtml(meal.name);
  const category = escapeHtml(meal.category || "Meal");
  const area = escapeHtml(meal.area || "International");
  const image = escapeHtml(meal.thumbnail || "");
  const description = escapeHtml(getDescription(meal));

  // ====== شكل الـ List ======
  if (isList) {
    return `
      <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex" data-meal-id="${id}">
        <div class="relative overflow-hidden" style="width: 160px; height: 240px; flex-shrink: 0;">
          <img
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            src="${image}"
            alt="${name}"
            loading="lazy"
          />
        </div>
        <div class="p-6 flex-1" style="min-width: 0;">
          <h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">${name}</h3>
          <p class="text-sm text-gray-600 mb-4 line-clamp-2">${description}</p>
          <div class="flex items-center justify-between text-sm">
            <span class="font-semibold text-gray-900">
              <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${category}
            </span>
            <span class="font-semibold text-gray-500">
              <i class="fa-solid fa-globe text-blue-500 mr-1"></i>${area}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // ====== Grid ======
  return `
    <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-meal-id="${id}">
      <div class="relative h-48 overflow-hidden">
        <img
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          src="${image}"
          alt="${name}"
          loading="lazy"
        />
        <div class="absolute bottom-3 left-3 flex gap-2">
          <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">${category}</span>
          <span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white">${area}</span>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">${name}</h3>
        <p class="text-xs text-gray-600 mb-3 line-clamp-2">${description}</p>
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-gray-900">
            <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${category}
          </span>
          <span class="font-semibold text-gray-500">
            <i class="fa-solid fa-globe text-blue-500 mr-1"></i>${area}
          </span>
        </div>
      </div>
    </div>
  `;
}