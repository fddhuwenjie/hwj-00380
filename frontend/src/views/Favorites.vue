<template>
  <div class="favorites-page">
    <div class="page-header">
      <h2 class="page-title">我的收藏</h2>
      <span class="page-subtitle">共 {{ recipes.length }} 个收藏的食谱</span>
    </div>

    <div class="content-wrapper">
      <div v-loading="loading" class="card">
        <div v-if="recipes.length > 0" class="recipes-grid">
          <div
            v-for="item in recipes"
            :key="item.id"
            class="recipe-card"
          >
            <div class="card-header">
              <div class="recipe-info">
                <h3 class="recipe-name">{{ item.name }}</h3>
                <div class="recipe-meta">
                  <el-tag :type="getCategoryTagType(item.category)" size="small">
                    {{ item.category }}
                  </el-tag>
                  <el-tag
                    v-if="item.avg_rating > 0"
                    type="warning"
                    size="small"
                    effect="light"
                  >
                    <el-icon><Star fill="#E6A23C" /></el-icon>
                    {{ item.avg_rating.toFixed(1) }}
                  </el-tag>
                  <span class="servings-text">
                    <el-icon><User /></el-icon>
                    {{ item.servings }} 人份
                  </span>
                </div>
              </div>
              <el-button
                type="warning"
                link
                size="large"
                @click="handleRemoveFavorite(item)"
                class="favorite-btn"
              >
                <el-icon><Star fill="#E6A23C" /></el-icon>
              </el-button>
            </div>

            <div class="nutrition-preview">
              <div class="nutrition-item">
                <span class="nutrition-label">热量</span>
                <span class="nutrition-value">{{ getNutrition(item).calories }}<span class="unit">kcal</span></span>
              </div>
              <div class="nutrition-item">
                <span class="nutrition-label">蛋白质</span>
                <span class="nutrition-value">{{ getNutrition(item).protein }}<span class="unit">g</span></span>
              </div>
              <div class="nutrition-item">
                <span class="nutrition-label">脂肪</span>
                <span class="nutrition-value">{{ getNutrition(item).fat }}<span class="unit">g</span></span>
              </div>
            </div>

            <div class="nutrition-tags" v-if="getWarnings(item).length > 0">
              <span
                v-for="warning in getWarnings(item)"
                :key="warning.type"
                :class="['warning-tag', getWarningClass(warning.type)]"
              >
                {{ warning.message }}
              </span>
            </div>

            <div class="card-actions">
              <el-button type="primary" @click="handleView(item)">
                <el-icon><View /></el-icon>
                查看详情
              </el-button>
              <el-button type="success" @click="handleAddToDiary(item)">
                <el-icon><Plus /></el-icon>
                添加到日记
              </el-button>
            </div>

            <div class="favorite-time">
              收藏于 {{ formatDate(item.favorite_created_at) }}
            </div>
          </div>
        </div>

        <el-empty v-else description="暂无收藏的食谱" :image-size="100">
          <el-button type="primary" @click="goToRecipes">
            <el-icon><Star /></el-icon>
            去收藏食谱
          </el-button>
        </el-empty>
      </div>
    </div>

    <el-dialog v-model="addToDiaryDialog.visible" title="添加到饮食日记" width="400px">
      <el-form label-width="80px">
        <el-form-item label="日期">
          <el-date-picker
            v-model="addToDiaryDialog.date"
            type="date"
            :editable="false"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="份数">
          <el-input-number
            v-model="addToDiaryDialog.servings"
            :min="0.5"
            :max="10"
            :step="0.5"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addToDiaryDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddToDiary">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, User, View, Plus } from '@element-plus/icons-vue'
import { useFavoritesStore, useDiaryStore } from '@/store'
import { getRecipeNutrition } from '@/api/recipes'
import { checkNutritionWarnings } from '@/utils/nutrition'

const router = useRouter()
const favoritesStore = useFavoritesStore()
const diaryStore = useDiaryStore()

const loading = ref(false)
const recipes = ref([])
const nutritionCache = ref({})

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addToDiaryDialog = reactive({
  visible: false,
  recipe: null,
  date: formatDate(new Date()),
  servings: 1
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

const getWarningClass = (type) => {
  const classMap = {
    sodium: 'high-sodium',
    fat: 'high-fat',
    sugar: 'high-sugar'
  }
  return classMap[type] || ''
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
  const nutrition = nutritionCache.value[recipe.id] || { calories: 0, protein: 0, fat: 0 }
  return {
    calories: Math.round(nutrition.calories || 0),
    protein: Math.round(nutrition.protein || 0),
    fat: Math.round(nutrition.fat || 0)
  }
}

const getWarnings = (recipe) => {
  const nutrition = nutritionCache.value[recipe.id]
  if (!nutrition) return []
  return checkNutritionWarnings(nutrition)
}

const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await favoritesStore.fetchList()
    const data = res.data || res
    recipes.value = data.favorites || data || []
    nutritionCache.value = {}
    for (const recipe of recipes.value) {
      await loadNutrition(recipe.id)
    }
  } catch (err) {
    ElMessage.error(err.message || '加载收藏列表失败')
  } finally {
    loading.value = false
  }
}

const handleView = (recipe) => {
  router.push(`/recipes/${recipe.id}`)
}

const handleRemoveFavorite = async (recipe) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消收藏「${recipe.name}」吗？`,
      '确认取消',
      { type: 'warning' }
    )
    await favoritesStore.remove(recipe.id)
    ElMessage.success('已取消收藏')
    await loadFavorites()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '操作失败')
    }
  }
}

const handleAddToDiary = (recipe) => {
  addToDiaryDialog.recipe = recipe
  addToDiaryDialog.date = formatDate(new Date())
  addToDiaryDialog.servings = 1
  addToDiaryDialog.visible = true
}

const confirmAddToDiary = async () => {
  if (!addToDiaryDialog.recipe) return
  try {
    await diaryStore.addItem({
      date: addToDiaryDialog.date,
      item_type: 'recipe',
      recipe_id: addToDiaryDialog.recipe.id,
      item_name: addToDiaryDialog.recipe.name,
      servings: addToDiaryDialog.servings
    })
    ElMessage.success(`已添加「${addToDiaryDialog.recipe.name}」到饮食日记`)
    addToDiaryDialog.visible = false
  } catch (err) {
    ElMessage.error(err.message || '添加失败')
  }
}

const goToRecipes = () => {
  router.push('/recipes')
}

onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.favorites-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.recipe-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.recipe-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #dcdfe6;
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.recipe-info {
  flex: 1;
  min-width: 0;
}

.recipe-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.recipe-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.servings-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.servings-text .el-icon {
  font-size: 14px;
}

.favorite-btn {
  padding: 4px 8px;
  font-size: 20px;
}

.favorite-btn:hover {
  transform: scale(1.1);
}

.nutrition-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.nutrition-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.nutrition-label {
  font-size: 12px;
  color: #909399;
}

.nutrition-value {
  font-size: 20px;
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.warning-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.high-sodium,
.high-sugar {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

.high-fat {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #f5dab1;
}

.card-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.card-actions .el-button {
  flex: 1;
}

.favorite-time {
  font-size: 12px;
  color: #c0c4cc;
  text-align: right;
  padding-top: 12px;
  border-top: 1px solid #f2f6fc;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .recipes-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: column;
  }
}
</style>
