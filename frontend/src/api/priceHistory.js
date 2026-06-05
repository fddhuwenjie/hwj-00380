import api from './index'

export function getIngredientPriceHistory(ingredientId, params) {
  return api.get(`/price-history/ingredient/${ingredientId}`, { params })
}

export function updateIngredientPrice(ingredientId, data) {
  return api.post(`/price-history/ingredient/${ingredientId}`, data)
}

export function getRecipesByBudget(params) {
  return api.get('/price-history/recipes/budget', { params })
}

export function getRecipePrice(recipeId) {
  return api.get(`/price-history/recipe/${recipeId}/price`)
}
