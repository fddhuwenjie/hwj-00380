import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/ingredients'
  },
  {
    path: '/ingredients',
    name: 'Ingredients',
    component: () => import('@/views/Ingredients.vue')
  },
  {
    path: '/recipes',
    name: 'Recipes',
    component: () => import('@/views/Recipes.vue')
  },
  {
    path: '/recipes/create',
    name: 'CreateRecipe',
    component: () => import('@/views/RecipeForm.vue')
  },
  {
    path: '/recipes/:id/edit',
    name: 'EditRecipe',
    component: () => import('@/views/RecipeForm.vue')
  },
  {
    path: '/recipes/:id',
    name: 'RecipeDetail',
    component: () => import('@/views/RecipeDetail.vue')
  },
  {
    path: '/meal-plans',
    name: 'MealPlans',
    component: () => import('@/views/MealPlans.vue')
  },
  {
    path: '/shopping-list',
    name: 'ShoppingList',
    component: () => import('@/views/ShoppingList.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue')
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue')
  },
  {
    path: '/diary',
    name: 'Diary',
    component: () => import('@/views/Diary.vue')
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/Statistics.vue')
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/Favorites.vue')
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('@/views/Community.vue')
  },
  {
    path: '/suggestions',
    name: 'Suggestions',
    component: () => import('@/views/Suggestions.vue')
  },
  {
    path: '/price-trends',
    name: 'PriceTrends',
    component: () => import('@/views/PriceTrends.vue')
  },
  {
    path: '/data-management',
    name: 'DataManagement',
    component: () => import('@/views/DataManagement.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
