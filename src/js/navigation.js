const pages = {
  home: {
    title: "Meals & Recipes",
    subtitle: "Discover delicious and nutritious recipes tailored for you",
    sections: [
      "search-filters-section",
      "meal-categories-section",
      "all-recipes-section",
    ],
  },
  products: {
    title: "Product Scanner",
    subtitle: "Search packaged foods by name or barcode",
    sections: ["products-section"],
  },
  foodlog: {
    title: "Food Log",
    subtitle: "Track your daily nutrition and food intake",
    sections: ["foodlog-section"],
  },
};

const allSections = [
  "search-filters-section",
  "meal-categories-section",
  "all-recipes-section",
  "meal-details",
  "products-section",
  "foodlog-section",
];

const links = document.querySelectorAll(".nav-link");
const headerTitle = document.querySelector("#header h1");
const headerSubtitle = document.querySelector("#header p");

const activeLinkClass =
  "nav-link flex items-center gap-3 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg transition-all";
const normalLinkClass =
  "nav-link flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-all";

function getPageName() {
  const name = location.hash.replace("#", "");
  if (pages[name]) {
    return name;
  }
  return "home";
}

function showPage() {
  const name = getPageName();
  const page = pages[name];

  // 1) نخفي كل الأقسام
  for (let i = 0; i < allSections.length; i++) {
    const section = document.getElementById(allSections[i]);
    section.style.display = "none";
  }

  // 2) نظهر أقسام الصفحة الحالية بس
  for (let i = 0; i < page.sections.length; i++) {
    const section = document.getElementById(page.sections[i]);
    section.style.display = "block";
  }

  // 3) نغير عنوان الهيدر
  headerTitle.textContent = page.title;
  headerSubtitle.textContent = page.subtitle;

  // 4) نلون اللينك الـ active
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const text = link.querySelector("span");

    if (link.getAttribute("href") === "#" + name) {
      link.className = activeLinkClass;
      text.className = "font-semibold";
    } else {
      link.className = normalLinkClass;
      text.className = "font-medium";
    }
  }

  // 5) نطلع لفوق
  window.scrollTo(0, 0);
}

export function startNavigation() {
  if (!pages[location.hash.replace("#", "")]) {
    history.replaceState(null, "", "#home");
  }

  window.addEventListener("hashchange", showPage);

  showPage();
}