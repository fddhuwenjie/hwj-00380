import api from './index'

export const getMealPlans = (params) => {
  return api.get('/meal-plans', { params })
}

export const getMealPlanById = (id) => {
  return api.get(`/meal-plans/${id}`)
}

export const createMealPlan = (data) => {
  return api.post('/meal-plans', data)
}

export const updateMealPlan = (id, data) => {
  return api.put(`/meal-plans/${id}`, data)
}

export const deleteMealPlan = (id) => {
  return api.delete(`/meal-plans/${id}`)
}

export const getMealPlanNutrition = (id) => {
  return api.get(`/meal-plans/${id}/nutrition`)
}
