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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
