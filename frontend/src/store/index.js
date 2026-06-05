import { defineStore } from 'pinia'
import { getIngredients, createIngredient, updateIngredient, deleteIngredient } from '@/api/ingredients'
import { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe } from '@/api/recipes'
import { getMealPlans, createMealPlan, updateMealPlan, deleteMealPlan } from '@/api/mealPlans'
import { getShoppingList, addShoppingItem, updateShoppingItem, deleteShoppingItem, toggleShoppingItem, clearShoppingList } from '@/api/shoppingList'
import { getGoals, updateGoals, getGoalProgress } from '@/api/goals'
import { getCurrentUser, updateUserProfile, calculateBMR, getActivityLevels, getUserTargets } from '@/api/users'
import { getFavorites, toggleFavorite } from '@/api/favorites'
import { getRecipeRatings, rateRecipe } from '@/api/ratings'
import { getDiary, getDiaryHistory, addDiaryItem, deleteDiaryItem } from '@/api/diary'
import { getNutritionTrend, getMacroRatio, getStatisticsSummary } from '@/api/statistics'

export const useIngredientsStore = defineStore('ingredients', {
  state: () => ({
    list: [],
    loading: false,
    current: null
  }),
  actions: {
    async fetchList(params) {
      this.loading = true
      try {
        const res = await getIngredients(params)
        this.list = res.data || res
      } finally {
        this.loading = false
      }
    },
    async create(data) {
      const res = await createIngredient(data)
      return res
    },
    async update(id, data) {
      const res = await updateIngredient(id, data)
      return res
    },
    async remove(id) {
      const res = await deleteIngredient(id)
      return res
    }
  }
})

export const useRecipesStore = defineStore('recipes', {
  state: () => ({
    list: [],
    loading: false,
    current: null
  }),
  actions: {
    async fetchList(params) {
      this.loading = true
      try {
        const res = await getRecipes(params)
        this.list = res.data || res
      } finally {
        this.loading = false
      }
    },
    async fetchById(id) {
      this.loading = true
      try {
        const res = await getRecipeById(id)
        this.current = res.data || res
        return this.current
      } finally {
        this.loading = false
      }
    },
    async create(data) {
      const res = await createRecipe(data)
      return res
    },
    async update(id, data) {
      const res = await updateRecipe(id, data)
      return res
    },
    async remove(id) {
      const res = await deleteRecipe(id)
      return res
    }
  }
})

export const useMealPlanStore = defineStore('mealPlan', {
  state: () => ({
    list: [],
    loading: false,
    current: null
  }),
  actions: {
    async fetchList(params) {
      this.loading = true
      try {
        const res = await getMealPlans(params)
        this.list = res.data || res
      } finally {
        this.loading = false
      }
    },
    async create(data) {
      const res = await createMealPlan(data)
      return res
    },
    async update(id, data) {
      const res = await updateMealPlan(id, data)
      return res
    },
    async remove(id) {
      const res = await deleteMealPlan(id)
      return res
    }
  }
})

export const useShoppingListStore = defineStore('shoppingList', {
  state: () => ({
    list: [],
    loading: false
  }),
  actions: {
    async fetchList(params) {
      this.loading = true
      try {
        const res = await getShoppingList(params)
        this.list = res.data || res
      } finally {
        this.loading = false
      }
    },
    async add(data) {
      const res = await addShoppingItem(data)
      return res
    },
    async update(id, data) {
      const res = await updateShoppingItem(id, data)
      return res
    },
    async remove(id) {
      const res = await deleteShoppingItem(id)
      return res
    },
    async toggle(id) {
      const res = await toggleShoppingItem(id)
      return res
    },
    async clear() {
      const res = await clearShoppingList()
      return res
    }
  }
})

export const useGoalsStore = defineStore('goals', {
  state: () => ({
    data: null,
    progress: null,
    loading: false
  }),
  actions: {
    async fetch() {
      this.loading = true
      try {
        const res = await getGoals()
        this.data = res.data || res
      } finally {
        this.loading = false
      }
    },
    async update(data) {
      const res = await updateGoals(data)
      this.data = res.data || res
      return res
    },
    async fetchProgress() {
      this.loading = true
      try {
        const res = await getGoalProgress()
        this.progress = res.data || res
      } finally {
        this.loading = false
      }
    }
  }
})

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
    targets: null,
    activityLevels: [],
    loading: false
  }),
  actions: {
    async fetchProfile() {
      this.loading = true
      try {
        const res = await getCurrentUser()
        this.profile = res.data || res
        return this.profile
      } finally {
        this.loading = false
      }
    },
    async updateProfile(data) {
      const res = await updateUserProfile(data)
      this.profile = res.data || res
      return res
    },
    async calculate(data) {
      const res = await calculateBMR(data)
      return res
    },
    async fetchActivityLevels() {
      const res = await getActivityLevels()
      this.activityLevels = res.data || res
      return this.activityLevels
    },
    async fetchTargets() {
      const res = await getUserTargets()
      this.targets = res.data || res
      return this.targets
    }
  }
})

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    list: [],
    loading: false
  }),
  actions: {
    async fetchList() {
      this.loading = true
      try {
        const res = await getFavorites()
        this.list = res.data || res
        return this.list
      } finally {
        this.loading = false
      }
    },
    async toggle(recipeId) {
      const res = await toggleFavorite(recipeId)
      return res
    }
  }
})

export const useRatingsStore = defineStore('ratings', {
  state: () => ({
    current: null,
    loading: false
  }),
  actions: {
    async fetchRecipeRatings(recipeId) {
      this.loading = true
      try {
        const res = await getRecipeRatings(recipeId)
        this.current = res.data || res
        return this.current
      } finally {
        this.loading = false
      }
    },
    async rateRecipe(recipeId, data) {
      const res = await rateRecipe(recipeId, data)
      return res
    }
  }
})

export const useDiaryStore = defineStore('diary', {
  state: () => ({
    current: null,
    history: [],
    loading: false
  }),
  actions: {
    async fetch(date) {
      this.loading = true
      try {
        const res = await getDiary(date)
        this.current = res.data || res
        return this.current
      } finally {
        this.loading = false
      }
    },
    async fetchHistory(params) {
      this.loading = true
      try {
        const res = await getDiaryHistory(params)
        this.history = res.data || res
        return this.history
      } finally {
        this.loading = false
      }
    },
    async addItem(data) {
      const res = await addDiaryItem(data)
      return res
    },
    async deleteItem(itemId) {
      const res = await deleteDiaryItem(itemId)
      return res
    }
  }
})

export const useStatisticsStore = defineStore('statistics', {
  state: () => ({
    trend: null,
    macroRatio: null,
    summary: null,
    loading: false
  }),
  actions: {
    async fetchTrend(days) {
      this.loading = true
      try {
        const res = await getNutritionTrend(days)
        this.trend = res.data || res
        return this.trend
      } finally {
        this.loading = false
      }
    },
    async fetchMacroRatio(period) {
      this.loading = true
      try {
        const res = await getMacroRatio(period)
        this.macroRatio = res.data || res
        return this.macroRatio
      } finally {
        this.loading = false
      }
    },
    async fetchSummary(period) {
      this.loading = true
      try {
        const res = await getStatisticsSummary(period)
        this.summary = res.data || res
        return this.summary
      } finally {
        this.loading = false
      }
    }
  }
})
