import api from './index'

export const getFavorites = () => {
  return api.get('/favorites')
}

export const getFavoriteStatus = (recipeId) => {
  return api.get(`/favorites/recipe/${recipeId}`)
}

export const addFavorite = (recipeId) => {
  return api.post(`/favorites/recipe/${recipeId}`)
}

export const removeFavorite = (recipeId) => {
  return api.delete(`/favorites/recipe/${recipeId}`)
}

export const toggleFavorite = (recipeId) => {
  return api.post(`/favorites/recipe/${recipeId}/toggle`)
}
