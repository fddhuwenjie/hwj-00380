<template>
  <div class="recipe-detail-page">
    <div class="page-header">
      <h2 class="page-title">食谱详情</h2>
      <div class="header-actions">
        <el-button @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="content-wrapper">
      <template v-if="recipe">
        <div class="card recipe-header-card">
          <div class="recipe-title-section">
            <h1 class="recipe-name">{{ recipe.name }}</h1>
            <div class="recipe-tags">
              <el-tag :type="getCategoryTagType(recipe.category)" size="large">
                {{ recipe.category }}
              </el-tag>
              <el-tag type="info" size="large">
                <el-icon><User /></el-icon>
                {{ baseServings }} 人份
              </el-tag>
            </div>
          </div>

          <div class="servings-control">
            <span class="control-label">调整份数：</span>
            <el-input-number
              v-model="currentServings"
              :min="1"
              :max="20"
              :step="1"
              size="large"
            />
            <span class="servings-hint">
              （所有食材用量和营养数据将自动按比例缩放）
            </span>
          </div>

          <div class="warning-tags" v-if="warnings.length > 0">
            <el-tag
              v-for="warning in warnings"
              :key="warning.type"
              type="warning"
              effect="light"
              size="large"
              :class="`warning-${warning.type}`"
            >
              {{ warning.message }}
            </el-tag>
          </div>
        </div>

        <div class="card nutrition-overview-card">
          <h3 class="section-title">营养概览</h3>
          <div class="nutrition-grid">
            <div class="nutrition-item">
              <span class="nutrition-label">热量</span>
              <span class="nutrition-value calories">{{ scaledNutrition.calories }}</span>
              <span class="nutrition-unit">kcal</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">蛋白质</span>
              <span class="nutrition-value protein">{{ scaledNutrition.protein }}</span>
              <span class="nutrition-unit">g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">脂肪</span>
              <span class="nutrition-value fat">{{ scaledNutrition.fat }}</span>
              <span class="nutrition-unit">g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">碳水化合物</span>
              <span class="nutrition-value carbohydrate">{{ scaledNutrition.carbohydrate }}</span>
              <span class="nutrition-unit">g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">膳食纤维</span>
              <span class="nutrition-value fiber">{{ scaledNutrition.fiber }}</span>
              <span class="nutrition-unit">g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">钠</span>
              <span class="nutrition-value sodium">{{ scaledNutrition.sodium }}</span>
              <span class="nutrition-unit">mg</span>
            </div>
          </div>
        </div>

        <div class="charts-row">
          <div class="card chart-card">
            <h3 class="section-title">三大营养素能量占比</h3>
            <div id="pieChart" class="chart-container"></div>
          </div>

          <div class="card chart-card">
            <h3 class="section-title">营养与每日推荐摄入量对比</h3>
            <div id="barChart" class="chart-container"></div>
          </div>
        </div>

        <div class="card steps-card">
          <h3 class="section-title">制作步骤</h3>
          <div class="steps-list">
            <div
              v-for="step in sortedSteps"
              :key="step.step_order"
              class="step-item"
            >
              <div class="step-number">{{ step.step_order }}</div>
              <div class="step-content">
                <p class="step-description">{{ step.description }}</p>
                <div class="step-ingredients" v-if="step.ingredients && step.ingredients.length > 0">
                  <span class="ingredients-label">食材：</span>
                  <el-tag
                    v-for="(ing, idx) in getScaledStepIngredients(step)"
                    :key="idx"
                    size="small"
                    type="info"
                    effect="plain"
                    class="ingredient-tag"
                  >
                    {{ ing.ingredient_name || ing.name }} {{ ing.amount }}g
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card ingredients-card">
          <h3 class="section-title">食材汇总（{{ currentServings }}人份）</h3>
          <el-table :data="mergedIngredients" stripe>
            <el-table-column prop="ingredient_name" label="食材名称" min-width="150" />
            <el-table-column label="总用量" width="120" align="right">
              <template #default="{ row }">
                <span class="amount-text">{{ row.amount }}g</span>
              </template>
            </el-table-column>
            <el-table-column label="每份用量" width="120" align="right">
              <template #default="{ row }">
                <span class="per-serving-text">{{ (row.amount / currentServings).toFixed(1) }}g</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <el-empty v-else-if="!loading" description="未找到食谱信息" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useRoute, useRouter } from 'vue-router'
import { useRecipesStore, useGoalsStore } from '@/store'
import { checkNutritionWarnings, calculateMacronutrientRatio, roundNutrition } from '@/utils/nutrition'
import { ArrowLeft, Edit, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getRecipeNutrition } from '@/api/recipes'

const route = useRoute()
const router = useRouter()
const recipesStore = useRecipesStore()
const goalsStore = useGoalsStore()

const loading = ref(false)
const recipe = ref(null)
const baseNutrition = ref(null)
const baseServings = ref(1)
const currentServings = ref(1)
let pieChart = null
let barChart = null

const dailyRecommendations = {
  calories: 2000,
  protein: 60,
  fat: 65,
  carbohydrate: 300,
  fiber: 25,
  sodium: 2000
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

const sortedSteps = computed(() => {
  if (!recipe.value?.steps) return []
  return [...recipe.value.steps].sort((a, b) => a.step_order - b.step_order)
})

const scaleFactor = computed(() => {
  return currentServings.value / baseServings.value
})

const scaledNutrition = computed(() => {
  if (!baseNutrition.value) {
    return { calories: 0, protein: 0, fat: 0, carbohydrate: 0, fiber: 0, sodium: 0 }
  }
  const scaled = {}
  for (const key in baseNutrition.value) {
    if (typeof baseNutrition.value[key] === 'number') {
      scaled[key] = baseNutrition.value[key] * scaleFactor.value
    }
  }
  return roundNutrition(scaled, 1)
})

const warnings = computed(() => {
  if (!scaledNutrition.value) return []
  const perServing = {}
  for (const key in scaledNutrition.value) {
    perServing[key] = scaledNutrition.value[key] / currentServings.value
  }
  return checkNutritionWarnings(perServing)
})

const macroRatio = computed(() => {
  if (!scaledNutrition.value) return { protein: 0, fat: 0, carbohydrate: 0 }
  return calculateMacronutrientRatio(
    scaledNutrition.value.protein,
    scaledNutrition.value.fat,
    scaledNutrition.value.carbohydrate
  )
})

const mergedIngredients = computed(() => {
  if (!recipe.value?.steps) return []
  const ingredientMap = new Map()
  for (const step of recipe.value.steps) {
    if (step.ingredients) {
      for (const ing of step.ingredients) {
        const name = ing.ingredient_name || ing.name
        const scaledAmount = Math.round(ing.amount * scaleFactor.value * 10) / 10
        if (ingredientMap.has(name)) {
          ingredientMap.set(
            name,
            ingredientMap.get(name) + scaledAmount
          )
        } else {
          ingredientMap.set(name, scaledAmount)
        }
      }
    }
  }
  return Array.from(ingredientMap.entries()).map(([name, amount]) => ({
    ingredient_name: name,
    amount: Math.round(amount * 10) / 10
  }))
})

const getScaledStepIngredients = (step) => {
  if (!step.ingredients) return []
  return step.ingredients.map(ing => ({
    ...ing,
    amount: Math.round(ing.amount * scaleFactor.value * 10) / 10
  }))
}

const initPieChart = () => {
  const chartDom = document.getElementById('pieChart')
  if (!chartDom) return
  pieChart = echarts.init(chartDom)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [
      {
        name: '营养素占比',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'inside',
          formatter: '{c}%',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#fff'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: macroRatio.value.protein, name: '蛋白质', itemStyle: { color: '#67C23A' } },
          { value: macroRatio.value.fat, name: '脂肪', itemStyle: { color: '#E6A23C' } },
          { value: macroRatio.value.carbohydrate, name: '碳水化合物', itemStyle: { color: '#409EFF' } }
        ]
      }
    ]
  }
  pieChart.setOption(option)
}

const initBarChart = () => {
  const chartDom = document.getElementById('barChart')
  if (!chartDom) return
  barChart = echarts.init(chartDom)
  const goals = goalsStore.data || dailyRecommendations
  const labels = ['热量(kcal)', '蛋白质(g)', '脂肪(g)', '碳水(g)', '纤维(g)', '钠(mg)']
  const currentData = [
    scaledNutrition.value.calories,
    scaledNutrition.value.protein,
    scaledNutrition.value.fat,
    scaledNutrition.value.carbohydrate,
    scaledNutrition.value.fiber,
    scaledNutrition.value.sodium
  ]
  const targetData = [
    goals.calories || 2000,
    goals.protein || 60,
    goals.fat || 65,
    goals.carbohydrate || 300,
    goals.fiber || 25,
    goals.sodium || 2000
  ]
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['实际值', '推荐值'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        interval: 0,
        rotate: 0
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '实际值',
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        data: currentData
      },
      {
        name: '推荐值',
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#c2e9b6' },
            { offset: 0.5, color: '#67c23a' },
            { offset: 1, color: '#67c23a' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        data: targetData
      }
    ]
  }
  barChart.setOption(option)
}

const updateCharts = () => {
  if (pieChart) {
    pieChart.setOption({
      series: [{
        data: [
          { value: macroRatio.value.protein, name: '蛋白质', itemStyle: { color: '#67C23A' } },
          { value: macroRatio.value.fat, name: '脂肪', itemStyle: { color: '#E6A23C' } },
          { value: macroRatio.value.carbohydrate, name: '碳水化合物', itemStyle: { color: '#409EFF' } }
        ]
      }]
    })
  }
  if (barChart) {
    const goals = goalsStore.data || dailyRecommendations
    barChart.setOption({
      series: [{
        data: [
          scaledNutrition.value.calories,
          scaledNutrition.value.protein,
          scaledNutrition.value.fat,
          scaledNutrition.value.carbohydrate,
          scaledNutrition.value.fiber,
          scaledNutrition.value.sodium
        ]
      }, {
        data: [
          goals.calories || 2000,
          goals.protein || 60,
          goals.fat || 65,
          goals.carbohydrate || 300,
          goals.fiber || 25,
          goals.sodium || 2000
        ]
      }]
    })
  }
}

const handleResize = () => {
  pieChart?.resize()
  barChart?.resize()
}

const loadData = async () => {
  loading.value = true
  try {
    await goalsStore.fetch()
    recipe.value = await recipesStore.fetchById(route.params.id)
    if (recipe.value) {
      baseServings.value = recipe.value.servings || 1
      currentServings.value = recipe.value.servings || 1
      try {
        const res = await getRecipeNutrition(recipe.value.id)
        baseNutrition.value = res.data?.perServing || res.data || res
      } catch (err) {
        ElMessage.warning('营养数据加载失败，使用默认值')
        baseNutrition.value = { calories: 0, protein: 0, fat: 0, carbohydrate: 0, fiber: 0, sodium: 0 }
      }
    }
    await nextTick()
    initPieChart()
    initBarChart()
  } catch (err) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.push('/recipes')
}

const handleEdit = () => {
  router.push(`/recipes/${recipe.value.id}/edit`)
}

watch(currentServings, () => {
  updateCharts()
})

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped>
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

.recipe-header-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recipe-title-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recipe-name {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.recipe-tags {
  display: flex;
  gap: 12px;
  align-items: center;
}

.servings-control {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.servings-hint {
  font-size: 12px;
  color: #909399;
}

.warning-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.warning-tags :deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.warning-sodium {
  border-color: #f56c6c;
  background-color: #fef0f0;
  color: #f56c6c;
}

.warning-fat {
  border-color: #e6a23c;
  background-color: #fdf6ec;
  color: #e6a23c;
}

.warning-sugar {
  border-color: #f56c6c;
  background-color: #fef0f0;
  color: #f56c6c;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.nutrition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border-radius: 12px;
  gap: 8px;
}

.nutrition-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.nutrition-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.nutrition-value.calories {
  color: #409EFF;
}

.nutrition-value.protein {
  color: #67C23A;
}

.nutrition-value.fat {
  color: #E6A23C;
}

.nutrition-value.carbohydrate {
  color: #F56C6C;
}

.nutrition-value.fiber {
  color: #909399;
}

.nutrition-value.sodium {
  color: #606266;
}

.nutrition-unit {
  font-size: 12px;
  color: #909399;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.step-item:hover {
  background: #ecf5ff;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.1);
}

.step-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  flex: 1;
}

.step-description {
  font-size: 15px;
  color: #303133;
  line-height: 1.8;
  margin: 0 0 12px 0;
}

.step-ingredients {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.ingredients-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.ingredient-tag {
  margin: 0;
}

.ingredients-card :deep(.el-table) {
  margin-top: 0;
}

.amount-text {
  font-weight: 600;
  color: #409EFF;
  font-size: 14px;
}

.per-serving-text {
  color: #909399;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .nutrition-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .nutrition-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .recipe-name {
    font-size: 22px;
  }

  .servings-control {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
