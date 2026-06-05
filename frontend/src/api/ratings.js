import api from './index'

export const getRecipeRatings = (recipeId) => {
  return api.get(`/ratings/recipe/${recipeId}`)
}

export const rateRecipe = (recipeId, data) => {
  return api.post(`/ratings/recipe/${recipeId}`, data)
}

export const deleteRating = (recipeId) => {
  return api.delete(`/ratings/recipe/${recipeId}`)
}
