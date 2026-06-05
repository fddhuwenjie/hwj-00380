import api from './index'

export const getRecipes = (params) => {
  return api.get('/recipes', { params })
}

export const getRecipesSorted = (params) => {
  return api.get('/recipes', { params })
}

export const getRecipeById = (id) => {
  return api.get(`/recipes/${id}`)
}

export const createRecipe = (data) => {
  return api.post('/recipes', data)
}

export const updateRecipe = (id, data) => {
  return api.put(`/recipes/${id}`, data)
}

export const deleteRecipe = (id) => {
  return api.delete(`/recipes/${id}`)
}

export const searchRecipes = (params) => {
  return api.get('/recipes/search', { params })
}

export const getRecipeNutrition = (id) => {
  return api.get(`/recipes/${id}/nutrition`)
}
