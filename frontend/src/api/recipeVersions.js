import api from './index'

export function getRecipeVersions(recipeId) {
  return api.get(`/recipe-versions/recipe/${recipeId}`)
}

export function getVersionDetail(versionId) {
  return api.get(`/recipe-versions/${versionId}`)
}

export function rollbackVersion(versionId) {
  return api.post(`/recipe-versions/${versionId}/rollback`)
}

export function createVersionSnapshot(recipeId) {
  return api.post(`/recipe-versions/recipe/${recipeId}/snapshot`)
}
