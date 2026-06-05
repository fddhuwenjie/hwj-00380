import api from './index'

export const getIngredientReplacements = (ingredientId) => {
  return api.get(`/replacements/ingredient/${ingredientId}`)
}

export const calculateReplacedRecipeNutrition = (recipeId, data) => {
  return api.post(`/replacements/recipe/${recipeId}/calculate`, data)
}
