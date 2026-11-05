const BASE_URL = "https://nutriplan-api.vercel.app/api";

const NUTRITION_API_KEY = "LBwjMpzDPJf7KFLTTpz8Nk9nmMQWzwN8jcBCPQtH";

async function getData(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Request failed with status " + response.status);
  }

  return await response.json();
}

// ================= Meals =================
export async function getCategories() {
  const data = await getData(`${BASE_URL}/meals/categories`);
  return data.results;
}

export async function getAreas() {
  const data = await getData(`${BASE_URL}/meals/areas`);
  return data.results;
}

export async function getRandomMeals(count) {
  const data = await getData(`${BASE_URL}/meals/random?count=${count}`);
  return data.results;
}

export async function searchMeals(text) {
  const data = await getData(
    `${BASE_URL}/meals/search?q=${encodeURIComponent(text)}&page=1&limit=25`
  );
  return data.results;
}

export async function filterByCategory(category) {
  const data = await getData(
    `${BASE_URL}/meals/filter?category=${encodeURIComponent(category)}&page=1&limit=25`
  );
  return data.results;
}

export async function filterByArea(area) {
  const data = await getData(
    `${BASE_URL}/meals/filter?area=${encodeURIComponent(area)}&page=1&limit=25`
  );
  return data.results;
}

export async function getMealById(id) {
  const data = await getData(`${BASE_URL}/meals/${id}`);
  return data.result;
}

// ================= Nutrition (POST) =================
export async function analyzeNutrition(recipeName, ingredients) {
  const response = await fetch(`${BASE_URL}/nutrition/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": NUTRITION_API_KEY,
    },
    body: JSON.stringify({
      recipeName: recipeName,
      ingredients: ingredients,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error("Nutrition failed: " + response.status + " " + text);
  }

  return await response.json();
}

// ================= Products =================
// بنرجع الـ data كاملة عشان محتاجين الـ pagination
export async function searchProducts(text, page) {
  return await getData(
    `${BASE_URL}/products/search?q=${encodeURIComponent(text)}&page=${page}&limit=24`
  );
}

export async function getProductsByCategory(category, page) {
  return await getData(
    `${BASE_URL}/products/category/${encodeURIComponent(category)}?page=${page}&limit=24`
  );
}

export async function getProductCategories() {
  const data = await getData(`${BASE_URL}/products/categories`);
  return data.results;
}

// لو الباركود مش موجود بنرجع null بدل error
export async function getProductByBarcode(barcode) {
  const response = await fetch(
    `${BASE_URL}/products/barcode/${encodeURIComponent(barcode)}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Request failed with status " + response.status);
  }

  const data = await response.json();
  return data.result;
}