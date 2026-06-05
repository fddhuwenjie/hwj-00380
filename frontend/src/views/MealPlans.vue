<template>
  <div class="meal-plans-page">
    <div class="main-container">
      <div class="sidebar">
        <div class="sidebar-header">
          <h3 class="sidebar-title">食谱库</h3>
        </div>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索食谱..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="category-tags">
          <el-tag
            v-for="cat in categories"
            :key="cat.value"
            :type="selectedCategory === cat.value ? 'primary' : 'info'"
            :effect="selectedCategory === cat.value ? 'dark' : 'plain'"
            class="category-tag"
            @click="selectedCategory = cat.value"
          >
            {{ cat.label }}
          </el-tag>
        </div>
        <div class="recipe-list">
          <div
            v-for="recipe in filteredRecipes"
            :key="recipe.id"
            class="recipe-card"
            draggable="true"
            @dragstart="handleDragStart($event, recipe)"
          >
            <div class="recipe-card-header">
              <span class="recipe-name">{{ recipe.name }}</span>
              <el-tag :type="getCategoryTagType(recipe.category)" size="small">
                {{ recipe.category }}
              </el-tag>
            </div>
            <div class="recipe-meta">
              <span class="meta-item">{{ recipe.servings }} 份</span>
            </div>
          </div>
          <el-empty v-if="filteredRecipes.length === 0" description="暂无食谱" :image-size="60" />
        </div>
      </div>

      <div class="main-content">
        <div class="top-bar">
          <h2 class="page-title">本周饮食计划</h2>
          <div class="top-actions">
            <el-button type="primary" @click="openGoalsDialog">
              <el-icon><Setting /></el-icon>
              配置健康目标
            </el-button>
            <el-button type="success" @click="generateShoppingList">
              <el-icon><ShoppingCart /></el-icon>
              生成购物清单
            </el-button>
          </div>
        </div>

        <div class="weekly-summary-card">
          <h3 class="card-title">每周营养汇总</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">总热量</span>
              <span class="summary-value">{{ weeklyTotal.calories }}<span class="unit">kcal</span></span>
              <span class="summary-avg">日均 {{ weeklyAvg.calories }} kcal</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">蛋白质</span>
              <span class="summary-value">{{ weeklyTotal.protein }}<span class="unit">g</span></span>
              <span class="summary-avg">日均 {{ weeklyAvg.protein }} g</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">脂肪</span>
              <span class="summary-value">{{ weeklyTotal.fat }}<span class="unit">g</span></span>
              <span class="summary-avg">日均 {{ weeklyAvg.fat }} g</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">碳水化合物</span>
              <span class="summary-value">{{ weeklyTotal.carbohydrate }}<span class="unit">g</span></span>
              <span class="summary-avg">日均 {{ weeklyAvg.carbohydrate }} g</span>
            </div>
          </div>
        </div>

        <div class="plan-table-card">
          <table class="plan-table">
            <thead>
              <tr>
                <th class="meal-header">餐次</th>
                <th v-for="(day, index) in days" :key="index" class="day-header">
                  {{ day }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="meal in mealTypes" :key="meal.key">
                <td class="meal-label">{{ meal.label }}</td>
                <td
                  v-for="(day, dayIndex) in days"
                  :key="dayIndex"
                  class="plan-cell"
                  @dragover.prevent
                  @drop="handleDrop($event, dayIndex, meal.key)"
                >
                  <div
                    v-for="(item, itemIndex) in getPlanItems(dayIndex, meal.key)"
                    :key="item.id"
                    class="meal-item"
                  >
                    <div class="meal-item-header">
                      <span class="meal-item-name">{{ item.recipe_name }}</span>
                      <el-button
                        type="danger"
                        link
                        size="small"
                        @click="handleRemoveItem(dayIndex, meal.key, itemIndex)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    <div class="meal-item-controls">
                      <el-input-number
                        :model-value="item.servings"
                        :min="1"
                        :max="10"
                        size="small"
                        @change="(val) => handleServingsChange(dayIndex, meal.key, itemIndex, val)"
                      />
                      <span class="servings-unit">份</span>
                    </div>
                  </div>
                  <div v-if="getPlanItems(dayIndex, meal.key).length === 0" class="empty-cell">
                    拖入食谱
                  </div>
                </td>
              </tr>
              <tr class="nutrition-row">
                <td class="meal-label">每日营养</td>
                <td
                  v-for="(day, dayIndex) in days"
                  :key="dayIndex"
                  class="nutrition-cell"
                >
                  <div class="nutrition-progress">
                    <div class="progress-item">
                      <span class="progress-label">热量</span>
                      <el-progress
                        :percentage="getNutritionPercentage(dayIndex, 'calories')"
                        :stroke-width="6"
                        :show-text="false"
                      />
                      <span class="progress-value">
                        {{ getDayNutrition(dayIndex).calories }}/{{ goals.calories || 2000 }}
                      </span>
                    </div>
                    <div class="progress-item">
                      <span class="progress-label">蛋白</span>
                      <el-progress
                        :percentage="getNutritionPercentage(dayIndex, 'protein')"
                        :stroke-width="6"
                        :show-text="false"
                      />
                      <span class="progress-value">
                        {{ getDayNutrition(dayIndex).protein }}/{{ goals.protein || 60 }}
                      </span>
                    </div>
                    <div class="progress-item">
                      <span class="progress-label">脂肪</span>
                      <el-progress
                        :percentage="getNutritionPercentage(dayIndex, 'fat')"
                        :stroke-width="6"
                        :show-text="false"
                      />
                      <span class="progress-value">
                        {{ getDayNutrition(dayIndex).fat }}/{{ goals.fat || 65 }}
                      </span>
                    </div>
                    <div class="progress-item">
                      <span class="progress-label">碳水</span>
                      <el-progress
                        :percentage="getNutritionPercentage(dayIndex, 'carbohydrate')"
                        :stroke-width="6"
                        :show-text="false"
                      />
                      <span class="progress-value">
                        {{ getDayNutrition(dayIndex).carbohydrate }}/{{ goals.carbohydrate || 300 }}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="goalsDialogVisible"
      title="健康目标配置"
      width="500px"
    >
      <el-form :model="goalForm" label-width="100px">
        <el-form-item label="热量">
          <el-input-number
            v-model="goalForm.calories"
            :min="1000"
            :max="5000"
            :step="50"
            style="width: 100%;"
          />
          <span class="form-unit">kcal/天</span>
        </el-form-item>
        <el-form-item label="蛋白质">
          <el-input-number
            v-model="goalForm.protein"
            :min="20"
            :max="200"
            :step="5"
            style="width: 100%;"
          />
          <span class="form-unit">g/天</span>
        </el-form-item>
        <el-form-item label="脂肪">
          <el-input-number
            v-model="goalForm.fat"
            :min="20"
            :max="150"
            :step="5"
            style="width: 100%;"
          />
          <span class="form-unit">g/天</span>
        </el-form-item>
        <el-form-item label="碳水化合物">
          <el-input-number
            v-model="goalForm.carbohydrate"
            :min="50"
            :max="500"
            :step="10"
            style="width: 100%;"
          />
          <span class="form-unit">g/天</span>
        </el-form-item>
        <el-form-item label="膳食纤维">
          <el-input-number
            v-model="goalForm.fiber"
            :min="10"
            :max="100"
            :step="5"
            style="width: 100%;"
          />
          <span class="form-unit">g/天</span>
        </el-form-item>
        <el-form-item label="钠">
          <el-input-number
            v-model="goalForm.sodium"
            :min="500"
            :max="5000"
            :step="100"
            style="width: 100%;"
          />
          <span class="form-unit">mg/天</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="goalsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveGoals">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRecipesStore, useMealPlanStore, useGoalsStore } from '@/store'
import { Search, Setting, ShoppingCart, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { roundNutrition } from '@/utils/nutrition'

const router = useRouter()
const recipesStore = useRecipesStore()
const mealPlanStore = useMealPlanStore()
const goalsStore = useGoalsStore()

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const mealTypes = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' }
]

const categories = [
  { label: '全部', value: '' },
  { label: '早餐', value: '早餐' },
  { label: '午餐', value: '午餐' },
  { label: '晚餐', value: '晚餐' },
  { label: '小食', value: '小食' }
]

const searchKeyword = ref('')
const selectedCategory = ref('')
const goalsDialogVisible = ref(false)
const nutritionCache = reactive({})
let itemIdCounter = 1

const defaultGoals = {
  calories: 2000,
  protein: 60,
  fat: 65,
  carbohydrate: 300,
  fiber: 25,
  sodium: 2000
}

const goalForm = reactive({ ...defaultGoals })

const goals = computed(() => goalsStore.data || defaultGoals)

const planItems = reactive({})

for (let i = 0; i < 7; i++) {
  planItems[i] = {
    breakfast: [],
    lunch: [],
    dinner: []
  }
}

const filteredRecipes = computed(() => {
  let result = [...recipesStore.list]
  if (selectedCategory.value) {
    result = result.filter(r => r.category === selectedCategory.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(r => r.name.toLowerCase().includes(keyword))
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

const getPlanItems = (dayIndex, mealType) => {
  return planItems[dayIndex]?.[mealType] || []
}

const getRecipeNutrition = async (recipeId) => {
  if (nutritionCache[recipeId]) {
    return nutritionCache[recipeId]
  }
  try {
    const { getRecipeNutrition: fetchNutrition } = await import('@/api/recipes')
    const res = await fetchNutrition(recipeId)
    const data = res.data?.perServing || res.data || res
    nutritionCache[recipeId] = roundNutrition(data, 1)
    return nutritionCache[recipeId]
  } catch (err) {
    return { calories: 0, protein: 0, fat: 0, carbohydrate: 0, fiber: 0, sodium: 0 }
  }
}

const getItemNutrition = (item) => {
  const recipe = recipesStore.list.find(r => r.id === item.recipe_id)
  if (!recipe || !nutritionCache[item.recipe_id]) {
    return { calories: 0, protein: 0, fat: 0, carbohydrate: 0, fiber: 0, sodium: 0 }
  }
  const base = nutritionCache[item.recipe_id]
  const factor = item.servings / (recipe.servings || 1)
  return roundNutrition({
    calories: base.calories * factor,
    protein: base.protein * factor,
    fat: base.fat * factor,
    carbohydrate: base.carbohydrate * factor,
    fiber: base.fiber * factor,
    sodium: base.sodium * factor
  }, 1)
}

const getDayNutrition = (dayIndex) => {
  const dayMeals = planItems[dayIndex]
  if (!dayMeals) {
    return roundNutrition({ calories: 0, protein: 0, fat: 0, carbohydrate: 0, fiber: 0, sodium: 0 }, 1)
  }
  const allItems = [...dayMeals.breakfast, ...dayMeals.lunch, ...dayMeals.dinner]
  const result = allItems.reduce(
    (total, item) => {
      const nutri = getItemNutrition(item)
      return {
        calories: total.calories + nutri.calories,
        protein: total.protein + nutri.protein,
        fat: total.fat + nutri.fat,
        carbohydrate: total.carbohydrate + nutri.carbohydrate,
        fiber: total.fiber + nutri.fiber,
        sodium: total.sodium + nutri.sodium
      }
    },
    { calories: 0, protein: 0, fat: 0, carbohydrate: 0, fiber: 0, sodium: 0 }
  )
  return roundNutrition(result, 1)
}

const getNutritionPercentage = (dayIndex, nutrient) => {
  const dayNutri = getDayNutrition(dayIndex)
  const target = goals.value[nutrient] || defaultGoals[nutrient]
  const percentage = Math.round((dayNutri[nutrient] / target) * 100)
  return Math.min(percentage, 100)
}

const weeklyTotal = computed(() => {
  const result = { calories: 0, protein: 0, fat: 0, carbohydrate: 0, fiber: 0, sodium: 0 }
  for (let i = 0; i < 7; i++) {
    const dayNutri = getDayNutrition(i)
    result.calories += dayNutri.calories
    result.protein += dayNutri.protein
    result.fat += dayNutri.fat
    result.carbohydrate += dayNutri.carbohydrate
    result.fiber += dayNutri.fiber
    result.sodium += dayNutri.sodium
  }
  return roundNutrition(result, 1)
})

const weeklyAvg = computed(() => {
  return roundNutrition({
    calories: Math.round(weeklyTotal.value.calories / 7),
    protein: Math.round(weeklyTotal.value.protein / 7),
    fat: Math.round(weeklyTotal.value.fat / 7),
    carbohydrate: Math.round(weeklyTotal.value.carbohydrate / 7)
  }, 1)
})

const updateNutritionCache = async () => {
  for (const recipe of recipesStore.list) {
    await getRecipeNutrition(recipe.id)
  }
}

const handleDragStart = (e, recipe) => {
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('application/json', JSON.stringify({
    recipeId: recipe.id,
    recipeName: recipe.name
  }))
}

const handleDrop = (e, dayIndex, mealType) => {
  try {
    const data = JSON.parse(e.dataTransfer.getData('application/json'))
    const { recipeId, recipeName } = data
    
    const existingItem = planItems[dayIndex][mealType].find(
      item => item.recipe_id === recipeId
    )
    
    if (existingItem) {
      existingItem.servings += 1
      ElMessage.info('已增加该食谱份数')
    } else {
      planItems[dayIndex][mealType].push({
        id: itemIdCounter++,
        recipe_id: recipeId,
        recipe_name: recipeName,
        servings: 1
      })
      ElMessage.success(`已添加「${recipeName}」到${days[dayIndex]}${mealTypes.find(m => m.key === mealType)?.label}`)
    }
  } catch (err) {
    ElMessage.error('添加失败')
  }
}

const handleRemoveItem = (dayIndex, mealType, itemIndex) => {
  const item = planItems[dayIndex][mealType][itemIndex]
  planItems[dayIndex][mealType].splice(itemIndex, 1)
  ElMessage.info(`已移除「${item.recipe_name}」`)
}

const handleServingsChange = (dayIndex, mealType, itemIndex, value) => {
  planItems[dayIndex][mealType][itemIndex].servings = value
}

const openGoalsDialog = () => {
  Object.assign(goalForm, goals.value || defaultGoals)
  goalsDialogVisible.value = true
}

const saveGoals = async () => {
  try {
    await goalsStore.update(goalForm)
    ElMessage.success('健康目标已更新')
    goalsDialogVisible.value = false
  } catch (err) {
    ElMessage.error(err.message || '保存失败')
  }
}

const generateShoppingList = async () => {
  try {
    const { generateFromMealPlan } = await import('@/api/shoppingList')
    const planData = {
      name: `饮食计划 ${new Date().toLocaleDateString()}`,
      plan_items: planItems
    }
    const planRes = await mealPlanStore.create(planData)
    const planId = planRes.id || planRes.data?.id
    if (planId) {
      await generateFromMealPlan(planId)
      ElMessage.success('购物清单已生成')
      router.push('/shopping-list')
    }
  } catch (err) {
    ElMessage.error(err.message || '生成失败')
  }
}

const loadData = async () => {
  try {
    await Promise.all([
      recipesStore.fetchList(),
      goalsStore.fetch(),
      mealPlanStore.fetchList()
    ])
    await updateNutritionCache()

    if (mealPlanStore.list.length > 0) {
      const currentPlan = mealPlanStore.list[0]
      try {
        const detail = await mealPlanStore.fetchById(currentPlan.id)
        if (detail && detail.items) {
          detail.items.forEach(item => {
            const dayIdx = item.day_of_week
            const mealType = item.meal_type
            if (planItems[dayIdx] && planItems[dayIdx][mealType] !== undefined) {
              planItems[dayIdx][mealType].push({
                id: itemIdCounter++,
                recipe_id: item.recipe_id,
                recipe_name: item.recipe_name,
                servings: item.servings
              })
            }
          })
        }
      } catch (err) {
        console.log('加载计划详情失败，使用空白计划')
      }
    }
  } catch (err) {
    ElMessage.error(err.message || '加载失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.meal-plans-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.main-container {
  display: flex;
  gap: 20px;
  padding: 20px;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  position: sticky;
  top: 20px;
}

.sidebar-header {
  margin-bottom: 16px;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-input {
  margin-bottom: 16px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.category-tag {
  cursor: pointer;
}

.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recipe-card {
  padding: 12px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.3s ease;
}

.recipe-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  border-color: #409eff;
}

.recipe-card:active {
  cursor: grabbing;
}

.recipe-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.recipe-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.recipe-meta {
  font-size: 12px;
  color: #606266;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.top-actions {
  display: flex;
  gap: 12px;
}

.weekly-summary-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
  gap: 8px;
}

.summary-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.summary-value {
  font-size: 32px;
  font-weight: 700;
  color: #409eff;
  line-height: 1.2;
}

.summary-value .unit {
  font-size: 16px;
  font-weight: normal;
  color: #909399;
  margin-left: 4px;
}

.summary-avg {
  font-size: 12px;
  color: #909399;
}

.plan-table-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  overflow-x: auto;
}

.plan-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.plan-table th,
.plan-table td {
  border: 1px solid #ebeef5;
  padding: 12px;
  text-align: center;
  vertical-align: top;
}

.plan-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #303133;
}

.meal-header {
  width: 100px;
}

.day-header {
  width: calc((100% - 100px) / 7);
}

.meal-label {
  background: #fafafa;
  font-weight: 500;
  color: #606266;
}

.plan-cell {
  min-height: 120px;
  transition: all 0.3s ease;
}

.plan-cell:hover {
  background: #f5f7fa;
}

.meal-item {
  background: #ecf5ff;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
  text-align: left;
  border: 1px solid #d9ecff;
}

.meal-item:last-child {
  margin-bottom: 0;
}

.meal-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.meal-item-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.meal-item-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.servings-unit {
  font-size: 12px;
  color: #606266;
}

.empty-cell {
  color: #c0c4cc;
  font-size: 12px;
  padding: 20px 0;
}

.nutrition-row {
  background: #fafafa;
}

.nutrition-cell {
  padding: 12px 8px;
  text-align: left;
}

.nutrition-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.progress-label {
  width: 30px;
  color: #606266;
  flex-shrink: 0;
}

.progress-value {
  width: 70px;
  text-align: right;
  color: #909399;
  flex-shrink: 0;
  font-size: 10px;
}

.form-unit {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}

@media (max-width: 1400px) {
  .main-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: none;
    position: static;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .plan-table {
    table-layout: auto;
  }

  .top-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
