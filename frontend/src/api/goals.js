import api from './index'

export const getGoals = () => {
  return api.get('/goals')
}

export const updateGoals = (data) => {
  return api.put('/goals', data)
}

export const getCurrentGoals = () => {
  return api.get('/goals/current')
}

export const getGoalProgress = () => {
  return api.get('/goals/progress')
}

export const resetGoals = () => {
  return api.post('/goals/reset')
}
