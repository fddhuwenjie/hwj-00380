import api from './index'

export const getNutritionTrend = (days) => {
  const params = days ? { days } : {}
  return api.get('/statistics/trend', { params })
}

export const getMacroRatio = (period) => {
  const params = period ? { period } : {}
  return api.get('/statistics/macro-ratio', { params })
}

export const getStatisticsSummary = (period) => {
  const params = period ? { period } : {}
  return api.get('/statistics/summary', { params })
}
