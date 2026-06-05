import api from './index'

export const searchRecipesByNutrition = (params) => {
  return api.get('/search/recipes', { params }).then(res => {
    if (res.data) return res.data
    return res
  })
}

export const searchRecipesByIngredient = (name) => {
  return api.get('/search/recipes/by-ingredient', { params: { name } }).then(res => {
    if (res.data) return res.data
    return res
  })
}

export const getRecommendations = (ingredientNames) => {
  const params = { ingredients: ingredientNames.join(',') }
  return api.get('/search/recommendations', { params }).then(res => {
    if (res.data) return res.data
    return res
  })
}

export const searchAll = (keyword) => {
  return api.get('/search', { params: { keyword } })
}

export const getRecommendedRecipes = (params) => {
  return api.get('/search/recommendations/recipes', { params })
}

export const getRecommendationsByGoals = (goals) => {
  return api.post('/search/recommendations/by-goals', { goals })
}
