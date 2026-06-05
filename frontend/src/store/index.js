import { defineStore } from 'pinia'
import { getIngredients, createIngredient, updateIngredient, deleteIngredient } from '@/api/ingredients'
import { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe } from '@/api/recipes'
import { getMealPlans, createMealPlan, updateMealPlan, deleteMealPlan } from '@/api/mealPlans'
import { getShoppingList, addShoppingItem, updateShoppingItem, deleteShoppingItem, toggleShoppingItem, clearShoppingList } from '@/api/shoppingList'
import { getGoals, updateGoals, getGoalProgress } from '@/api/goals'

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
