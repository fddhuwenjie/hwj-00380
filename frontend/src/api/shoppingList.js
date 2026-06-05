import api from './index'

export const getShoppingList = (params) => {
  return api.get('/shopping-list', { params })
}

export const addShoppingItem = (data) => {
  return api.post('/shopping-list', data)
}

export const updateShoppingItem = (id, data) => {
  return api.put(`/shopping-list/${id}`, data)
}

export const deleteShoppingItem = (id) => {
  return api.delete(`/shopping-list/${id}`)
}

export const toggleShoppingItem = (id) => {
  return api.patch(`/shopping-list/${id}/toggle`)
}

export const clearShoppingList = () => {
  return api.delete('/shopping-list/clear')
}

export const generateFromMealPlan = (mealPlanId) => {
  return api.post('/shopping-list/generate', { mealPlanId })
}
