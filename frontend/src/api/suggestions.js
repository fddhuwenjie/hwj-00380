import api from './index'

export function getDailySuggestions() {
  return api.get('/suggestions/daily')
}
