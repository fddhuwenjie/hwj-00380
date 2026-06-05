import api from './index'

export function getCommunityRecipes(params) {
  return api.get('/community/recipes', { params })
}

export function getCommunityRecipeDetail(id, params) {
  return api.get(`/community/recipes/${id}`, { params })
}

export function importCommunityRecipe(id, data) {
  return api.post(`/community/recipes/${id}/import`, data)
}
