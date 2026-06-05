import api from './index'

export function exportAllData() {
  return api.get('/import-export/export/all', {
    responseType: 'blob'
  })
}

export function exportSingleRecipe(id) {
  return api.get(`/import-export/export/recipe/${id}`, {
    responseType: 'blob'
  })
}

export function validateImportData(data) {
  return api.post('/import-export/import/validate', { data })
}

export function importAllData(data) {
  return api.post('/import-export/import/all', { data })
}
