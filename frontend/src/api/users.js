import api from './index'

export const getCurrentUser = () => {
  return api.get('/users/current')
}

export const updateUserProfile = (data) => {
  return api.put('/users/profile', data)
}

export const calculateBMR = (data) => {
  return api.post('/users/calculate', data)
}

export const getActivityLevels = () => {
  return api.get('/users/activity-levels')
}

export const getUserTargets = () => {
  return api.get('/users/targets')
}
