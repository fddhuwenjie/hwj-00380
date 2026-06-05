<template>
  <div class="recipes-page">
    <div class="page-header">
      <h2 class="page-title">食谱管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创建食谱
      </el-button>
    </div>

    <div class="card">
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索食谱名称..."
          clearable
          style="width: 280px; margin-right: 16px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-radio-group v-model="currentCategory" @change="handleCategoryChange" size="default">
          <el-radio-button
            v-for="cat in categories"
            :key="cat.value"
            :value="cat.value"
          >
            {{ cat.label }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <div v-loading="recipes.loading" class="recipes-grid">
        <el-card
          v-for="recipe in filteredRecipes"
          :key="recipe.id"
          shadow="hover"
          class="recipe-card"
        >
          <div class="recipe-header">
            <h3 class="recipe-name">{{ recipe.name }}</h3>
            <el-tag :type="getCategoryTagType(recipe.category)" size="small">
              {{ recipe.category }}
            </el-tag>
          </div>

          <div class="recipe-meta">
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ recipe.servings }} 人份
            </span>
          </div>

          <div class="nutrition-preview">
            <div class="nutrition-item">
              <span class="nutrition-label">热量</span>
              <span class="nutrition-value">{{ getNutrition(recipe).calories }}<span class="unit">kcal</span></span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">蛋白</span>
              <span class="nutrition-value">{{ getNutrition(recipe).protein }}<span class="unit">g</span></span>
            </div>
          </div>

          <div class="nutrition-tags">
            <span
              v-for="warning in getWarnings(recipe)"
              :key="warning.type"
              :class="['warning-tag', getWarningClass(warning.type)]"
            >
              {{ warning.message }}
            </span>
          </div>

          <div class="recipe-actions">
            <el-button type="primary" link @click="handleView(recipe)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button type="success" link @click="handleEdit(recipe)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" link @click="handleDelete(recipe)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </el-card>
      </div>

      <div v-if="filteredRecipes.length === 0 && !recipes.loading" class="empty-state">
        <el-icon :size="48" style="margin-bottom: 16px;"><Document /></el-icon>
        <p>暂无食谱数据</p>
        <el-button type="primary" style="margin-top: 16px;" @click="handleCreate">
          创建第一个食谱
        </el-button>
      </div>
    </div>

    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
      <p>确定要删除食谱「{{ deletingRecipe?.name }}」吗？</p>
      <p style="color: #909399; font-size: 12px; margin-top: 8px;">此操作不可恢复，请谨慎操作。</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Search, User, View, Edit, Delete, Document } from '@element-plus/icons-vue'
import { useRecipesStore } from '@/store'
import { getRecipeNutrition } from '@/api/recipes'
import { checkNutritionWarnings } from '@/utils/nutrition'

const router = useRouter()
const recipes = useRecipesStore()

const categories = [
  { label: '全部', value: '' },
  { label: '早餐', value: '早餐' },
  { label: '午餐', value: '午餐' },
  { label: '晚餐', value: '晚餐' },
  { label: '小食', value: '小食' }
]

const searchKeyword = ref('')
const currentCategory = ref('')
const deleteDialogVisible = ref(false)
const deletingRecipe = ref(null)
const nutritionCache = ref({})

const filteredRecipes = computed(() => {
  let result = [...recipes.list]

  if (currentCategory.value) {
    result = result.filter(item => item.category === currentCategory.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(keyword)
    )
  }

  return result
})

const getCategoryTagType = (category) => {
  const typeMap = {
    '早餐': 'primary',
    '午餐': 'success',
    '晚餐': 'warning',
    '小食': 'info'
  }
  return typeMap[category] || 'info'
}

const loadNutrition = async (recipeId) => {
  if (nutritionCache.value[recipeId]) {
    return nutritionCache.value[recipeId]
  }

  try {
    const res = await getRecipeNutrition(recipeId)
    const data = res.data || res
    nutritionCache.value[recipeId] = data.perServing || data
    return nutritionCache.value[recipeId]
  } catch (error) {
    return { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, sodium: 0 }
  }
}

const getNutrition = (recipe) => {
  const nutrition = nutritionCache.value[recipe.id] || { calories: 0, protein: 0 }
  return {
    calories: Math.round(nutrition.calories || 0),
    protein: Math.round(nutrition.protein || 0)
  }
}

const getWarnings = (recipe) => {
  const nutrition = nutritionCache.value[recipe.id]
  if (!nutrition) return []
  return checkNutritionWarnings(nutrition)
}

const getWarningClass = (type) => {
  const classMap = {
    sodium: 'high-sodium',
    fat: 'high-fat',
    sugar: 'high-sugar'
  }
  return classMap[type] || ''
}

const loadData = async () => {
  await recipes.fetchList()
  nutritionCache.value = {}
  for (const recipe of recipes.list) {
    await loadNutrition(recipe.id)
  }
}

const handleSearch = () => {}

const handleCategoryChange = () => {}

const handleCreate = () => {
  router.push('/recipes/create')
}

const handleView = (recipe) => {
  router.push(`/recipes/${recipe.id}`)
}

const handleEdit = (recipe) => {
  router.push(`/recipes/${recipe.id}/edit`)
}

const handleDelete = (recipe) => {
  deletingRecipe.value = recipe
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  try {
    await recipes.remove(deletingRecipe.value.id)
    ElMessage.success('删除成功')
    deleteDialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
  margin-right: 12px;
}

.recipe-meta {
  margin-bottom: 16px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 14px;
}

.nutrition-preview {
  display: flex;
  gap: 24px;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.nutrition-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nutrition-label {
  font-size: 12px;
  color: #909399;
}

.nutrition-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.nutrition-value .unit {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
  margin-left: 2px;
}

.nutrition-tags {
  flex: 1;
  margin-bottom: 16px;
}

.recipe-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f2f6fc;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}
</style>
