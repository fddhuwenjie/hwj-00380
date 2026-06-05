import api from './index'

export const getDiary = (date) => {
  const params = date ? { date } : {}
  return api.get('/diary', { params })
}

export const getDiaryHistory = (params) => {
  return api.get('/diary/history', { params })
}

export const addDiaryItem = (data) => {
  return api.post('/diary/item', data)
}

export const deleteDiaryItem = (itemId) => {
  return api.delete(`/diary/item/${itemId}`)
}
