import api from './index'

export const getIngredients = (params) => {
  return api.get('/ingredients', { params })
}

export const getIngredientById = (id) => {
  return api.get(`/ingredients/${id}`)
}

export const createIngredient = (data) => {
  return api.post('/ingredients', data)
}

export const updateIngredient = (id, data) => {
  return api.put(`/ingredients/${id}`, data)
}

export const deleteIngredient = (id) => {
  return api.delete(`/ingredients/${id}`)
}

export const searchIngredients = (keyword) => {
  return api.get('/ingredients/search', { params: { keyword } })
}
