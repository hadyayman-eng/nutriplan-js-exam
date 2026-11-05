import { escapeHtml } from "./ui/components.js";
import { getCurrentMealData } from "./mealDetails.js";

const STORAGE_KEY = "nutriplan-foodlog";


const goals = { calories: 2000, protein: 50, carbs: 250, fat: 65 };

const dateElement = document.getElementById("foodlog-date");
const todaySection = document.getElementById("foodlog-today-section");
const weeklyChart = document.getElementById("weekly-chart");

// ================= LocalStorage =================
function loadLog() {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return [];

    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    return [];
  } catch (error) {
    console.log(error);
    return [];
  }
}

function saveLog(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ================= Helpers =================
// بيرجع تاريخ اليوم بالشكل ده: 2026-11-01
function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function round1(number) {
  return Math.round((Number(number) || 0) * 10) / 10;
}

function getTodayItems() {
  const today = dateKey(new Date());
  const log = loadLog();
  const items = [];

  for (let i = 0; i < log.length; i++) {
    if (log[i].date === today) {
      items.push(log[i]);
    }
  }
  return items;
}

function getTotals(items) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (let i = 0; i < items.length; i++) {
    totals.calories += items[i].calories;
    totals.protein += items[i].protein;
    totals.carbs += items[i].carbs;
    totals.fat += items[i].fat;
  }

  return totals;
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

// ================= Add Item (بنستخدمها في الوجبات والمنتجات) =================
export function addFoodLogItem(item) {
  const log = loadLog();
  const now = new Date();

  log.push({
    id: Date.now() + "-" + Math.floor(Math.random() * 1000),
    date: dateKey(now),
    time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    type: item.type,
    name: item.name,
    image: item.image || "",
    note: item.note || "",
    calories: Math.round(item.calories),
    protein: round1(item.protein),
    carbs: round1(item.carbs),
    fat: round1(item.fat),
  });

  saveLog(log);
}

// ================= Today's Nutrition =================
function progressCard(label, value, goal, unit, bgClass, barClass, textColor) {
  const percent = Math.round((value / goal) * 100);

  let barWidth = percent;
  if (barWidth > 100) barWidth = 100;

  const isOver = value > goal;
  const barStyle = isOver
    ? `width: ${barWidth}%; background-color: #ef4444;`
    : `width: ${barWidth}%;`;
  const percentColor = isOver ? "#ef4444" : "#6b7280";
  const valueColor = isOver ? "#ef4444" : textColor;

  let overText = "";
  if (isOver) {
    overText = `<p class="text-xs mt-1" style="color: #ef4444;">Over the daily limit by ${round1(value - goal)} ${unit}</p>`;
  }

  return `
    <div class="${bgClass} rounded-xl p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold text-gray-700">${label}</span>
        <span class="text-sm" style="color: ${percentColor};">${percent}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div class="${barClass} h-2.5 rounded-full" style="${barStyle}"></div>
      </div>
      <div class="flex items-center justify-between mt-2 text-sm">
        <span class="font-semibold" style="color: ${valueColor};">${round1(value)} ${unit}</span>
        <span class="text-gray-500">/ ${goal} ${unit}</span>
      </div>
      ${overText}
    </div>
  `;
}

function loggedItemHtml(item) {
  let imageHtml = `
    <div class="rounded-lg bg-purple-100 flex items-center justify-center" style="width: 48px; height: 48px; flex-shrink: 0;">
      <i class="fa-solid fa-pencil text-purple-600"></i>
    </div>
  `;

  if (item.image) {
    imageHtml = `
      <img
        src="${escapeHtml(item.image)}"
        alt="${escapeHtml(item.name)}"
        class="rounded-lg object-cover"
        style="width: 48px; height: 48px; flex-shrink: 0;"
      />
    `;
  }

  let note = escapeHtml(item.note);
  if (note !== "") {
    note += " • ";
  }

  return `
    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      ${imageHtml}
      <div class="flex-1" style="min-width: 0;">
        <p class="font-semibold text-gray-900 text-sm" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.name)}</p>
        <p class="text-xs text-gray-500">${note}${escapeHtml(item.time)}</p>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold">${item.calories} kcal</span>
        <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold">${item.protein}g P</span>
        <span class="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg font-semibold">${item.carbs}g C</span>
        <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg font-semibold">${item.fat}g F</span>
      </div>
      <button class="delete-log-btn text-red-500 hover:text-red-600 px-2" data-id="${escapeHtml(item.id)}" title="Remove">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;
}

function renderToday() {
  const items = getTodayItems();
  const totals = getTotals(items);

  let listHtml = `
    <div class="text-center py-8 text-gray-500">
      <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
      <p class="font-medium">No meals logged today</p>
      <p class="text-sm">Add meals from the Meals page or scan products</p>
    </div>
  `;

  if (items.length > 0) {
    listHtml = "";
    for (let i = 0; i < items.length; i++) {
      listHtml += loggedItemHtml(items[i]);
    }
  }

  let clearBtn = "";
  if (items.length > 0) {
    clearBtn = `
      <button id="clear-foodlog" class="text-red-500 hover:text-red-600 text-sm font-medium">
        <i class="fa-solid fa-trash mr-1"></i>Clear All
      </button>
    `;
  }

  todaySection.innerHTML = `
    <h3 class="text-lg font-bold text-gray-900 mb-4">
      <i class="fa-solid fa-fire text-orange-500 mr-2"></i>
      Today's Nutrition
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      ${progressCard("Calories", totals.calories, goals.calories, "kcal", "bg-emerald-50", "bg-emerald-500", "#059669")}
      ${progressCard("Protein", totals.protein, goals.protein, "g", "bg-blue-50", "bg-blue-500", "#2563eb")}
      ${progressCard("Carbs", totals.carbs, goals.carbs, "g", "bg-amber-50", "bg-amber-500", "#d97706")}
      ${progressCard("Fat", totals.fat, goals.fat, "g", "bg-purple-50", "bg-purple-500", "#9333ea")}
    </div>

    <div class="border-t border-gray-200 pt-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-gray-700">Logged Items (${items.length})</h4>
        ${clearBtn}
      </div>
      <div id="logged-items-list" class="space-y-2">
        ${listHtml}
      </div>
    </div>
  `;
}

// ================= Weekly Chart =================
function renderChart() {
  if (typeof Plotly === "undefined") {
    weeklyChart.textContent = "Chart could not be loaded";
    return;
  }

  const log = loadLog();
  const labels = [];
  const calories = [];
  const goalLine = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = dateKey(day);

    let sum = 0;
    for (let j = 0; j < log.length; j++) {
      if (log[j].date === key) {
        sum += log[j].calories;
      }
    }

    labels.push(
      day.toLocaleDateString("en-US", { weekday: "short" }) + " " + day.getDate()
    );
    calories.push(sum);
    goalLine.push(goals.calories);
  }

  const data = [
    {
      x: labels,
      y: calories,
      type: "bar",
      name: "Calories",
      marker: { color: "#10b981" },
      hovertemplate: "%{y} kcal<extra></extra>",
    },
    {
      x: labels,
      y: goalLine,
      type: "scatter",
      mode: "lines",
      name: "Daily goal",
      line: { color: "#f97316", dash: "dash" },
      hovertemplate: "Goal: %{y} kcal<extra></extra>",
    },
  ];

  const layout = {
    height: 256,
    margin: { l: 50, r: 20, t: 20, b: 40 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    legend: { orientation: "h", y: 1.2 },
    yaxis: { title: "kcal" },
  };

  weeklyChart.innerHTML = "";
  weeklyChart.style.display = "block";
  Plotly.newPlot(weeklyChart, data, layout, {
    responsive: true,
    displayModeBar: false,
  });
}

// ================= Show Page =================
function showFoodLog() {
  dateElement.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  renderToday();
  renderChart();
}

// ================= Actions =================
function deleteItem(id) {
  const log = loadLog();
  const newLog = [];

  for (let i = 0; i < log.length; i++) {
    if (log[i].id !== id) {
      newLog.push(log[i]);
    }
  }

  saveLog(newLog);
  showFoodLog();
}

function clearToday() {
  Swal.fire({
    title: "Clear today's log?",
    text: "All items logged today will be removed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, clear",
    confirmButtonColor: "#ef4444",
  }).then((result) => {
    if (!result.isConfirmed) return;

    const today = dateKey(new Date());
    const log = loadLog();
    const newLog = [];

    for (let i = 0; i < log.length; i++) {
      if (log[i].date !== today) {
        newLog.push(log[i]);
      }
    }

    saveLog(newLog);
    showFoodLog();
  });
}

function logCurrentMeal(mealId) {
  const data = getCurrentMealData();

  if (!data.meal || !data.nutrition || String(data.meal.id) !== String(mealId)) {
    Swal.fire({
      icon: "info",
      title: "Please wait",
      text: "Nutrition facts are not ready yet. Try again in a moment.",
    });
    return;
  }

  const meal = data.meal;
  const perServing = data.nutrition.perServing;

 
  Swal.fire({
    width: 440,
    html: `
      <div style="text-align: left;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
          <img
            src="${escapeHtml(meal.thumbnail || "")}"
            alt="${escapeHtml(meal.name)}"
            style="width: 64px; height: 64px; border-radius: 12px; object-fit: cover;"
          />
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0;">Log This Meal</h2>
            <p style="color: #6b7280; margin: 4px 0 0 0;">${escapeHtml(meal.name)}</p>
          </div>
        </div>

        <p style="font-weight: 600; color: #111827; margin-bottom: 12px;">Number of Servings</p>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <button id="srv-minus" type="button" style="width: 48px; height: 48px; border: none; border-radius: 10px; background: #f3f4f6; font-size: 22px; cursor: pointer;">−</button>
          <input
            id="srv-input"
            type="number"
            min="1"
            max="10"
            value="1"
            style="width: 100px; height: 48px; text-align: center; font-size: 22px; font-weight: 700; border: 2px solid #d1d5db; border-radius: 10px;"
          />
          <button id="srv-plus" type="button" style="width: 48px; height: 48px; border: none; border-radius: 10px; background: #f3f4f6; font-size: 22px; cursor: pointer;">+</button>
        </div>

        <div style="background: #ecfdf5; border-radius: 12px; padding: 16px; margin-bottom: 8px;">
          <p id="srv-label" style="color: #374151; margin: 0 0 12px 0;">Estimated nutrition per serving:</p>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); text-align: center;">
            <div>
              <p id="srv-calories" style="font-size: 24px; font-weight: 700; color: #059669; margin: 0;">0</p>
              <p style="font-size: 13px; color: #6b7280; margin: 2px 0 0 0;">Calories</p>
            </div>
            <div>
              <p id="srv-protein" style="font-size: 24px; font-weight: 700; color: #2563eb; margin: 0;">0g</p>
              <p style="font-size: 13px; color: #6b7280; margin: 2px 0 0 0;">Protein</p>
            </div>
            <div>
              <p id="srv-carbs" style="font-size: 24px; font-weight: 700; color: #d97706; margin: 0;">0g</p>
              <p style="font-size: 13px; color: #6b7280; margin: 2px 0 0 0;">Carbs</p>
            </div>
            <div>
              <p id="srv-fat" style="font-size: 24px; font-weight: 700; color: #9333ea; margin: 0;">0g</p>
              <p style="font-size: 13px; color: #6b7280; margin: 2px 0 0 0;">Fat</p>
            </div>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: '<i class="fa-solid fa-clipboard-list"></i> Log Meal',
    cancelButtonText: "Cancel",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#f3f4f6",
    focusConfirm: false,
    didOpen: () => {
      const input = document.getElementById("srv-input");
      const minus = document.getElementById("srv-minus");
      const plus = document.getElementById("srv-plus");

      
      function refresh() {
        let servings = Math.floor(Number(input.value));
        if (!(servings >= 1)) servings = 1;
        if (servings > 10) servings = 10;

        document.getElementById("srv-calories").textContent = Math.round(
          perServing.calories * servings
        );
        document.getElementById("srv-protein").textContent =
          Math.round(perServing.protein * servings) + "g";
        document.getElementById("srv-carbs").textContent =
          Math.round(perServing.carbs * servings) + "g";
        document.getElementById("srv-fat").textContent =
          Math.round(perServing.fat * servings) + "g";

        if (servings === 1) {
          document.getElementById("srv-label").textContent =
            "Estimated nutrition per serving:";
        } else {
          document.getElementById("srv-label").textContent =
            "Estimated nutrition for " + servings + " servings:";
        }
      }

      minus.addEventListener("click", () => {
        const servings = Number(input.value) || 1;
        if (servings > 1) {
          input.value = servings - 1;
        }
        refresh();
      });

      plus.addEventListener("click", () => {
        const servings = Number(input.value) || 1;
        if (servings < 10) {
          input.value = servings + 1;
        }
        refresh();
      });

      input.addEventListener("input", refresh);

      
      Swal.getActions().style.width = "100%";
      Swal.getConfirmButton().style.flex = "1";
      Swal.getCancelButton().style.flex = "1";
      Swal.getCancelButton().style.color = "#374151";

      refresh();
    },
    preConfirm: () => {
      const servings = Number(document.getElementById("srv-input").value);

      if (!Number.isInteger(servings) || servings < 1 || servings > 10) {
        Swal.showValidationMessage("Please enter a whole number from 1 to 10");
        return false;
      }

      return servings;
    },
  }).then((result) => {
    if (!result.isConfirmed) return;

    const servings = result.value;

    let servingsText = servings + " servings";
    if (servings === 1) {
      servingsText = "1 serving";
    }

    addFoodLogItem({
      type: "meal",
      name: meal.name,
      image: meal.thumbnail,
      note: servingsText,
      calories: perServing.calories * servings,
      protein: perServing.protein * servings,
      carbs: perServing.carbs * servings,
      fat: perServing.fat * servings,
    });

    // ====== 2) رسالة النجاح ======
    Swal.fire({
      icon: "success",
      title: "Meal Logged!",
      html: `
        <p style="color: #374151; font-size: 18px;">${escapeHtml(meal.name)} (${servingsText}) has been added to your daily log.</p>
        <p style="color: #059669; font-weight: 700; font-size: 20px; margin-top: 8px;">+${Math.round(perServing.calories * servings)} calories</p>
      `,
      showConfirmButton: false,
      timer: 2500,
    });
  });
}

function addCustomEntry() {
  Swal.fire({
    title: "Custom Entry",
    html: `
      <input id="custom-name" class="swal2-input" placeholder="Food name">
      <input id="custom-calories" type="number" min="0" class="swal2-input" placeholder="Calories (kcal)">
      <input id="custom-protein" type="number" min="0" class="swal2-input" placeholder="Protein (g)">
      <input id="custom-carbs" type="number" min="0" class="swal2-input" placeholder="Carbs (g)">
      <input id="custom-fat" type="number" min="0" class="swal2-input" placeholder="Fat (g)">
    `,
    showCancelButton: true,
    confirmButtonText: "Add",
    focusConfirm: false,
    preConfirm: () => {
      const name = document.getElementById("custom-name").value.trim();
      const calories = document.getElementById("custom-calories").value;
      const protein = document.getElementById("custom-protein").value || "0";
      const carbs = document.getElementById("custom-carbs").value || "0";
      const fat = document.getElementById("custom-fat").value || "0";

      if (name === "") {
        Swal.showValidationMessage("Please enter the food name");
        return false;
      }
      if (calories === "" || Number(calories) < 0) {
        Swal.showValidationMessage("Please enter valid calories");
        return false;
      }
      if (Number(protein) < 0 || Number(carbs) < 0 || Number(fat) < 0) {
        Swal.showValidationMessage("Values can not be negative");
        return false;
      }

      return {
        name: name,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
      };
    },
  }).then((result) => {
    if (!result.isConfirmed) return;

    addFoodLogItem({
      type: "custom",
      name: result.value.name,
      image: "",
      note: "Custom entry",
      calories: result.value.calories,
      protein: result.value.protein,
      carbs: result.value.carbs,
      fat: result.value.fat,
    });

    showFoodLog();
    showToast("Item added!", result.value.name);
  });
}

// ================= Start =================
export function startFoodLog() {
  // حذف عنصر أو Clear All
  todaySection.addEventListener("click", (event) => {
    const deleteBtn = event.target.closest(".delete-log-btn");
    if (deleteBtn) {
      deleteItem(deleteBtn.dataset.id);
      return;
    }

    const clearBtn = event.target.closest("#clear-foodlog");
    if (clearBtn) {
      clearToday();
    }
  });

  // زرار Log This Meal في صفحة التفاصيل
  document.getElementById("meal-details").addEventListener("click", (event) => {
    const logBtn = event.target.closest("#log-meal-btn");
    if (logBtn) {
      logCurrentMeal(logBtn.dataset.mealId);
    }
  });


  const quickButtons = document.querySelectorAll(".quick-log-btn");
  quickButtons[0].addEventListener("click", () => {
    location.hash = "#home";
  });
  quickButtons[1].addEventListener("click", () => {
    location.hash = "#products";
  });
  quickButtons[2].addEventListener("click", addCustomEntry);

  // كل ما نفتح تاب Food Log نحدث الداتا
  window.addEventListener("hashchange", () => {
    if (location.hash === "#foodlog") {
      showFoodLog();
    }
  });

  renderToday();

  if (location.hash === "#foodlog") {
    showFoodLog();
  }
}