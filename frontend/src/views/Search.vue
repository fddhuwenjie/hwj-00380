<template>
  <div class="search-page">
    <div class="page-header">
      <h2 class="page-title">搜索与推荐</h2>
    </div>

    <el-tabs v-model="activeTab" class="search-tabs">
      <el-tab-pane label="按营养条件搜索" name="nutrition">
        <div class="card">
          <h3 class="section-title">营养条件筛选</h3>
          <div class="filter-grid">
            <div class="filter-item">
              <label class="filter-label">热量 (kcal)</label>
              <div class="filter-range">
                <el-input-number v-model="filters.caloriesMin" :min="0" placeholder="最小" style="width: 120px;" />
                <span class="range-separator">-</span>
                <el-input-number v-model="filters.caloriesMax" :min="0" placeholder="最大" style="width: 120px;" />
              </div>
            </div>
            <div class="filter-item">
              <label class="filter-label">蛋白质 (g)</label>
              <div class="filter-range">
                <el-input-number v-model="filters.proteinMin" :min="0" placeholder="最小" style="width: 120px;" />
                <span class="range-separator">-</span>
                <el-input-number v-model="filters.proteinMax" :min="0" placeholder="最大" style="width: 120px;" />
              </div>
            </div>
            <div class="filter-item">
              <label class="filter-label">脂肪 (g)</label>
              <div class="filter-range">
                <el-input-number v-model="filters.fatMin" :min="0" placeholder="最小" style="width: 120px;" />
                <span class="range-separator">-</span>
                <el-input-number v-model="filters.fatMax" :min="0" placeholder="最大" style="width: 120px;" />
              </div>
            </div>
            <div class="filter-item">
              <label class="filter-label">碳水化合物 (g)</label>
              <div class="filter-range">
                <el-input-number v-model="filters.carbohydrateMin" :min="0" placeholder="最小" style="width: 120px;" />
                <span class="range-separator">-</span>
                <el-input-number v-model="filters.carbohydrateMax" :min="0" placeholder="最大" style="width: 120px;" />
              </div>
            </div>
            <div class="filter-item">
              <label class="filter-label">膳食纤维 (g)</label>
              <div class="filter-range">
                <el-input-number v-model="filters.fiberMin" :min="0" placeholder="最小" style="width: 120px;" />
                <span class="range-separator">-</span>
                <el-input-number v-model="filters.fiberMax" :min="0" placeholder="最大" style="width: 120px;" />
              </div>
            </div>
            <div class="filter-item">
              <label class="filter-label">钠 (mg)</label>
              <div class="filter-range">
                <el-input-number v-model="filters.sodiumMin" :min="0" placeholder="最小" style="width: 120px;" />
                <span class="range-separator">-</span>
                <el-input-number v-model="filters.sodiumMax" :min="0" placeholder="最大" style="width: 120px;" />
              </div>
            </div>
          </div>
          <div class="filter-actions">
            <el-button type="primary" @click="searchByNutrition" :loading="searching">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetFilters">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="按食材搜索" name="ingredient">
        <div class="card">
          <h3 class="section-title">输入食材名称查找食谱</h3>
          <div class="ingredient-search">
            <el-input
              v-model="ingredientKeyword"
              placeholder="输入食材名称，如：鸡胸肉"
              style="width: 400px; margin-right: 12px;"
              @keyup.enter="searchByIngredient"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="selectedIngredient"
              placeholder="或从常用食材中选择"
              filterable
              style="width: 300px; margin-right: 12px;"
              @change="handleSelectIngredient"
            >
              <el-option
                v-for="ing in commonIngredients"
                :key="ing.id"
                :label="ing.name"
                :value="ing.name"
              />
            </el-select>
            <el-button type="primary" @click="searchByIngredient" :loading="searching">
              搜索
            </el-button>
          </div>
          <div v-if="recentSearches.length > 0" class="recent-searches">
            <span class="recent-label">最近搜索：</span>
            <el-tag
              v-for="term in recentSearches"
              :key="term"
              type="info"
              effect="plain"
              class="recent-tag"
              @click="searchByIngredient(term)"
            >
              {{ term }}
            </el-tag>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="剩余食材推荐" name="recommend">
        <div class="card">
          <h3 class="section-title">选择你拥有的食材，为你推荐可做的食谱</h3>
          <div class="ingredient-selector">
            <div class="ingredient-categories">
              <el-tag
                v-for="cat in ingredientCategories"
                :key="cat.value"
                :type="selectedIngredientCategory === cat.value ? 'primary' : 'info'"
                :effect="selectedIngredientCategory === cat.value ? 'dark' : 'plain'"
                class="category-tag"
                @click="selectedIngredientCategory = cat.value"
              >
                {{ cat.label }}
              </el-tag>
            </div>
            <div class="ingredient-list">
              <el-tag
                v-for="ing in filteredIngredients"
                :key="ing.id"
                :type="isIngredientSelected(ing) ? 'success' : 'info'"
                :effect="isIngredientSelected(ing) ? 'dark' : 'plain'"
                class="ingredient-tag"
                @click="toggleIngredient(ing)"
              >
                {{ ing.name }}
              </el-tag>
            </div>
            <div class="selected-ingredients" v-if="selectedIngredients.length > 0">
              <span class="selected-label">已选食材：</span>
              <el-tag
                v-for="ing in selectedIngredients"
                :key="ing.id"
                type="success"
                closable
                class="selected-tag"
                @close="toggleIngredient(ing)"
              >
                {{ ing.name }}
              </el-tag>
            </div>
            <div class="recommend-actions">
              <el-button type="primary" @click="getRecommendations" :loading="searching">
                <el-icon><DataAnalysis /></el-icon>
                获取推荐
              </el-button>
              <el-button @click="clearSelectedIngredients">
                清空选择
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div class="card results-card" v-if="searchResults.length > 0">
      <div class="results-header">
        <h3 class="section-title">搜索结果</h3>
        <span class="results-count">找到 {{ searchResults.length }} 个食谱</span>
      </div>
      <div class="recipes-grid">
        <el-card
          v-for="recipe in searchResults"
          :key="recipe.id"
          shadow="hover"
          class="recipe-card"
        >
          <div class="recipe-header">
            <h4 class="recipe-name">{{ recipe.name }}</h4>
            <el-tag :type="getCategoryTagType(recipe.category)" size="small">
              {{ recipe.category }}
            </el-tag>
          </div>
          <div class="recipe-meta">
            <span>{{ recipe.servings }} 人份</span>
          </div>
          <div class="nutrition-preview" v-if="recipe.nutrition">
            <div class="nutri-item">
              <span class="nutri-label">热量</span>
              <span class="nutri-value">{{ Math.round(recipe.nutrition.calories) }} kcal</span>
            </div>
            <div class="nutri-item">
              <span class="nutri-label">蛋白</span>
              <span class="nutri-value">{{ Math.round(recipe.nutrition.protein) }} g</span>
            </div>
          </div>
          <div v-if="recipe.matchScore" class="match-score">
            <span class="match-label">匹配度</span>
            <el-progress
              :percentage="Math.round(recipe.matchScore * 100)"
              :stroke-width="8"
              color="#67c23a"
            />
          </div>
          <div class="recipe-actions">
            <el-button type="primary" link @click="viewRecipe(recipe)">
              查看详情
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <div v-else-if="hasSearched && searchResults.length === 0" class="empty-results">
      <el-icon :size="64" style="margin-bottom: 16px;"><Search /></el-icon>
      <p>没有找到符合条件的食谱</p>
      <p style="color: #909399; font-size: 13px; margin-top: 8px;">试试调整搜索条件</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, DataAnalysis } from '@element-plus/icons-vue'
import { useIngredientsStore, useRecipesStore } from '@/store'
import { searchRecipesByNutrition, searchRecipesByIngredient, getRecommendations as fetchRecommendations } from '@/api/search'

const router = useRouter()
const ingredientsStore = useIngredientsStore()
const recipesStore = useRecipesStore()

const activeTab = ref('nutrition')
const searching = ref(false)
const hasSearched = ref(false)
const searchResults = ref([])
const recentSearches = ref(['鸡胸肉', '鸡蛋', '番茄'])

const filters = reactive({
  caloriesMin: null,
  caloriesMax: null,
  proteinMin: null,
  proteinMax: null,
  fatMin: null,
  fatMax: null,
  carbohydrateMin: null,
  carbohydrateMax: null,
  fiberMin: null,
  fiberMax: null,
  sodiumMin: null,
  sodiumMax: null
})

const ingredientKeyword = ref('')
const selectedIngredient = ref('')

const ingredientCategories = [
  { label: '全部', value: '' },
  { label: '肉类', value: '肉类' },
  { label: '蔬菜', value: '蔬菜' },
  { label: '水果', value: '水果' },
  { label: '谷物', value: '谷物' },
  { label: '蛋奶', value: '蛋奶' },
  { label: '水产', value: '水产' }
]

const selectedIngredientCategory = ref('')
const selectedIngredients = ref([])

const commonIngredients = computed(() => {
  return ingredientsStore.list?.slice(0, 100) || []
})

const filteredIngredients = computed(() => {
  let list = ingredientsStore.list || []
  if (selectedIngredientCategory.value) {
    list = list.filter(i => i.category === selectedIngredientCategory.value)
  }
  return list.slice(0, 50)
})

const isIngredientSelected = (ing) => {
  return selectedIngredients.value.some(i => i.id === ing.id)
}

const toggleIngredient = (ing) => {
  const index = selectedIngredients.value.findIndex(i => i.id === ing.id)
  if (index > -1) {
    selectedIngredients.value.splice(index, 1)
  } else {
    selectedIngredients.value.push(ing)
  }
}

const clearSelectedIngredients = () => {
  selectedIngredients.value = []
}

const getCategoryTagType = (category) => {
  const typeMap = {
    '早餐': 'primary',
    '午餐': 'success',
    '晚餐': 'warning',
    '小食': 'info'
  }
  return typeMap[category] || 'info'
}

const viewRecipe = (recipe) => {
  router.push(`/recipes/${recipe.id}`)
}

const searchByNutrition = async () => {
  searching.value = true
  hasSearched.value = true
  try {
    const params = {}
    if (filters.caloriesMin !== null) params.caloriesMin = filters.caloriesMin
    if (filters.caloriesMax !== null) params.caloriesMax = filters.caloriesMax
    if (filters.proteinMin !== null) params.proteinMin = filters.proteinMin
    if (filters.proteinMax !== null) params.proteinMax = filters.proteinMax
    if (filters.fatMin !== null) params.fatMin = filters.fatMin
    if (filters.fatMax !== null) params.fatMax = filters.fatMax
    if (filters.carbohydrateMin !== null) params.carbohydrateMin = filters.carbohydrateMin
    if (filters.carbohydrateMax !== null) params.carbohydrateMax = filters.carbohydrateMax
    if (filters.fiberMin !== null) params.fiberMin = filters.fiberMin
    if (filters.fiberMax !== null) params.fiberMax = filters.fiberMax
    if (filters.sodiumMin !== null) params.sodiumMin = filters.sodiumMin
    if (filters.sodiumMax !== null) params.sodiumMax = filters.sodiumMax

    const res = await searchRecipesByNutrition(params)
    searchResults.value = res.data || res || []
    ElMessage.success(`找到 ${searchResults.value.length} 个食谱`)
  } catch (err) {
    ElMessage.error(err.message || '搜索失败')
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

const resetFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = null
  })
}

const searchByIngredient = async (keyword) => {
  const term = keyword || ingredientKeyword.value || selectedIngredient.value
  if (!term.trim()) {
    ElMessage.warning('请输入食材名称')
    return
  }
  
  searching.value = true
  hasSearched.value = true
  ingredientKeyword.value = term
  selectedIngredient.value = ''
  
  try {
    const res = await searchRecipesByIngredient(term)
    searchResults.value = res.data || res || []
    
    if (!recentSearches.value.includes(term)) {
      recentSearches.value.unshift(term)
      if (recentSearches.value.length > 5) {
        recentSearches.value.pop()
      }
    }
    
    ElMessage.success(`找到 ${searchResults.value.length} 个食谱`)
  } catch (err) {
    ElMessage.error(err.message || '搜索失败')
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

const handleSelectIngredient = (value) => {
  if (value) {
    searchByIngredient(value)
  }
}

const getRecommendations = async () => {
  if (selectedIngredients.value.length === 0) {
    ElMessage.warning('请至少选择一种食材')
    return
  }
  
  searching.value = true
  hasSearched.value = true
  
  try {
    const ingredientNames = selectedIngredients.value.map(i => i.name)
    const res = await fetchRecommendations(ingredientNames)
    const data = res.data || res || []
    searchResults.value = data.map(item => ({
      ...item,
      matchScore: item.match_ratio || item.matchScore
    }))
    ElMessage.success(`为你推荐 ${searchResults.value.length} 个食谱`)
  } catch (err) {
    ElMessage.error(err.message || '获取推荐失败')
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

const loadData = async () => {
  try {
    await Promise.all([
      ingredientsStore.fetchList(),
      recipesStore.fetchList()
    ])
  } catch (err) {
    ElMessage.error(err.message || '加载失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-tabs {
  margin-bottom: 20px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.filter-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-separator {
  color: #909399;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.ingredient-search {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.recent-searches {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.recent-label {
  font-size: 13px;
  color: #606266;
}

.recent-tag {
  cursor: pointer;
}

.ingredient-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ingredient-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  cursor: pointer;
}

.ingredient-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 80px;
}

.ingredient-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.ingredient-tag:hover {
  transform: translateY(-1px);
}

.selected-ingredients {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f0f9eb;
  border-radius: 8px;
}

.selected-label {
  font-size: 13px;
  color: #606266;
  margin-right: 4px;
}

.recommend-actions {
  display: flex;
  gap: 12px;
}

.results-card {
  margin-top: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-count {
  font-size: 14px;
  color: #909399;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.recipe-card {
  display: flex;
  flex-direction: column;
}

.recipe-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.recipe-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
  margin-right: 12px;
}

.recipe-meta {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.nutrition-preview {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  border-top: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.nutri-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nutri-label {
  font-size: 12px;
  color: #909399;
}

.nutri-value {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.match-score {
  margin-bottom: 12px;
  padding: 12px 0;
  border-top: 1px solid #ebeef5;
}

.match-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  display: block;
}

.recipe-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f2f6fc;
  margin-top: auto;
}

.empty-results {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 8px;
  color: #909399;
}

.empty-results .el-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .ingredient-search {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .ingredient-search .el-input,
  .ingredient-search .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .recipes-grid {
    grid-template-columns: 1fr;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
