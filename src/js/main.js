/**
 * NutriPlan - Main Entry Point
 * 
 * This is the main entry point for the application.
 * Import your modules and initialize the app here.
 */

/**
/**
 * NutriPlan - Main Entry Point
 */
import { startNavigation } from "./navigation.js";
import { startSidebar } from "./sidebar.js";
import { startMeals, setMealClickHandler } from "./meals.js";
import { startMealDetails, openMeal } from "./mealDetails.js";
import { startFoodLog } from "./foodlog.js";
import { startProducts } from "./products.js";

function hideLoadingOverlay() {
  const overlay = document.getElementById("app-loading-overlay");
  overlay.style.opacity = "0";
  setTimeout(() => {
    overlay.style.display = "none";
  }, 500);
}

startNavigation();
startSidebar();
startMealDetails();
startFoodLog();
startProducts();

setMealClickHandler(openMeal);

startMeals().then(() => {
  hideLoadingOverlay();
});