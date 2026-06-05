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
            <div class="title-row">
              <h1 class="recipe-name">{{ recipe.name }}</h1>
              <div class="title-actions">
                <el-button
                  :type="isFavorite ? 'warning' : 'default'"
                  size="large"
                  @click="toggleFavorite"
                >
                  <el-icon><Star :fill="isFavorite ? '#E6A23C' : 'none'" /></el-icon>
                  {{ isFavorite ? '已收藏' : '收藏' }}
                </el-button>
                <el-button type="primary" size="large" @click="openRatingDialog">
                  <el-icon><Star /></el-icon>
                  {{ userRating.rating > 0 ? '修改评分' : '去评分' }}
                </el-button>
              </div>
            </div>
            <div class="recipe-tags">
              <el-tag :type="getCategoryTagType(recipe.category)" size="large">
                {{ recipe.category }}
              </el-tag>
              <el-tag type="info" size="large">
                <el-icon><User /></el-icon>
                {{ baseServings }} 人份
              </el-tag>
              <el-tag type="warning" size="large" v-if="avgRating > 0">
                <el-icon><Star fill="#E6A23C" /></el-icon>
                {{ avgRating.toFixed(1) }} 分 ({{ ratingCount }}条评价)
              </el-tag>
              <el-tag type="warning" size="large" v-if="userRating.rating > 0">
                我的评分: {{ userRating.rating }} 星
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
            <el-button
              v-if="Object.keys(replacedIngredients).length > 0"
              type="danger"
              link
              @click="resetReplacements"
            >
              <el-icon><RefreshRight /></el-icon>
              重置替换
            </el-button>
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

          <el-alert
            v-if="Object.keys(replacedIngredients).length > 0"
            :title="'已替换 ' + Object.keys(replacedIngredients).length + ' 种食材，营养数据已重新计算'"
            type="success"
            :closable="false"
            show-icon
          />
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
          <div class="section-header">
            <h3 class="section-title">食材汇总（{{ currentServings }}人份）</h3>
            <span class="section-hint">点击「替换」查看相似食材推荐</span>
          </div>
          <el-table :data="mergedIngredients" stripe>
            <el-table-column prop="ingredient_name" label="食材名称" min-width="180">
              <template #default="{ row }">
                <div class="ingredient-name-cell">
                  <span :class="{ 'replaced-name': row.is_replaced }">
                    {{ row.ingredient_name }}
                  </span>
                  <el-tag
                    v-if="row.is_replaced"
                    type="success"
                    size="small"
                    effect="light"
                  >
                    已替换
                  </el-tag>
                </div>
              </template>
            </el-table-column>
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
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="showReplacements(row)"
                >
                  替换
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="card ratings-card" v-if="ratingsList.length > 0">
          <h3 class="section-title">
            <el-icon><ChatLineRound /></el-icon>
            用户评价 ({{ ratingsList.length }})
          </h3>
          <div class="ratings-list">
            <div
              v-for="rating in ratingsList"
              :key="rating.id"
              class="rating-item"
            >
              <div class="rating-header">
                <div class="rating-user">
                  <el-avatar :size="36" class="rating-avatar">
                    {{ (rating.username || 'U').charAt(0).toUpperCase() }}
                  </el-avatar>
                  <div class="rating-info">
                    <span class="rating-username">{{ rating.username || '匿名用户' }}</span>
                    <div class="rating-stars">
                      <el-rate
                        :model-value="rating.rating"
                        disabled
                        size="small"
                      />
                    </div>
                  </div>
                </div>
                <span class="rating-date">{{ formatDate(rating.created_at) }}</span>
              </div>
              <p v-if="rating.comment" class="rating-comment">{{ rating.comment }}</p>
            </div>
          </div>
        </div>
      </template>

      <el-dialog
        v-model="showRatingDialog"
        :title="userRating.rating > 0 ? '修改评分' : '给食谱评分'"
        width="500px"
      >
        <el-form label-width="80px" class="rating-form">
          <el-form-item label="评分">
            <el-rate
              v-model="ratingForm.rating"
              size="large"
              show-text
              :texts="['很差', '较差', '还行', '推荐', '超赞']"
            />
          </el-form-item>
          <el-form-item label="评价">
            <el-input
              v-model="ratingForm.comment"
              type="textarea"
              :rows="4"
              placeholder="分享您对这个食谱的看法..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showRatingDialog = false">取消</el-button>
          <el-button type="primary" @click="submitRating">提交</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="replacements.visible"
        title="食材替换建议"
        width="600px"
        append-to-body
      >
        <div v-loading="replacements.loading" class="replacement-content">
          <div v-if="replacements.ingredient" class="replacement-header">
            <span>原食材：</span>
            <el-tag type="info" size="large">
              {{ replacements.ingredient.ingredient_name }}
            </el-tag>
            <span class="replacement-tip">（选择以下任一食材进行替换，营养数据将自动重算）</span>
          </div>

          <el-radio-group
            v-model="replacements.selectedIngredient"
            class="replacement-list"
          >
            <el-radio
              v-for="item in replacements.list"
              :key="item.id"
              :value="item"
              class="replacement-item"
            >
              <div class="replacement-item-content">
                <div class="replacement-item-header">
                  <span class="replacement-name">{{ item.name }}</span>
                  <el-tag
                    v-if="item.calorie_diff_percent"
                    :type="Math.abs(item.calorie_diff_percent) < 10 ? 'success' : 'warning'"
                    size="small"
                  >
                    热量{{ item.calorie_diff_percent > 0 ? '+' : '' }}{{ item.calorie_diff_percent.toFixed(1) }}%
                  </el-tag>
                </div>
                <div class="replacement-item-nutrition">
                  <span>热量：{{ item.calories }} kcal/100g</span>
                  <span>蛋白质：{{ item.protein }}g</span>
                  <span>脂肪：{{ item.fat }}g</span>
                  <span>碳水：{{ item.carbs }}g</span>
                </div>
              </div>
            </el-radio>
          </el-radio-group>
        </div>
        <template #footer>
          <el-button @click="replacements.visible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="!replacements.selectedIngredient"
            @click="applyReplacement"
          >
            确认替换
          </el-button>
        </template>
      </el-dialog>

      <el-empty v-if="!recipe && !loading" description="未找到食谱信息" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useRoute, useRouter } from 'vue-router'
import { useRecipesStore, useGoalsStore, useFavoritesStore, useRatingsStore } from '@/store'
import { checkNutritionWarnings, calculateMacronutrientRatio, roundNutrition } from '@/utils/nutrition'
import { ArrowLeft, Edit, User, Star, RefreshRight, Delete, ChatLineRound, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRecipeNutrition } from '@/api/recipes'
import { getIngredientReplacements, calculateReplacedRecipeNutrition } from '@/api/replacements'

const route = useRoute()
const router = useRouter()
const recipesStore = useRecipesStore()
const goalsStore = useGoalsStore()
const favoritesStore = useFavoritesStore()
const ratingsStore = useRatingsStore()

const loading = ref(false)
const recipe = ref(null)
const baseNutrition = ref(null)
const baseServings = ref(1)
const currentServings = ref(1)
let pieChart = null
let barChart = null

const isFavorite = ref(false)
const avgRating = ref(0)
const ratingCount = ref(0)
const userRating = reactive({
  rating: 0,
  comment: ''
})
const ratingsList = ref([])
const showRatingDialog = ref(false)
const ratingForm = reactive({
  rating: 0,
  comment: ''
})

const replacements = reactive({
  visible: false,
  ingredient: null,
  list: [],
  selectedIngredient: null,
  loading: false
})

const replacedIngredients = ref({})
const adjustedNutrition = ref(null)

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

const effectiveNutrition = computed(() => {
  if (adjustedNutrition.value) {
    return adjustedNutrition.value
  }
  return baseNutrition.value || { calories: 0, protein: 0, fat: 0, carbohydrate: 0, fiber: 0, sodium: 0 }
})

const scaledNutrition = computed(() => {
  const base = effectiveNutrition.value
  const scaled = {}
  for (const key in base) {
    if (typeof base[key] === 'number') {
      scaled[key] = base[key] * scaleFactor.value
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
        const ingredientId = ing.ingredient_id || ing.id
        const scaledAmount = Math.round(ing.amount * scaleFactor.value * 10) / 10
        if (ingredientMap.has(name)) {
          const existing = ingredientMap.get(name)
          existing.amount += scaledAmount
        } else {
          ingredientMap.set(name, {
            ingredient_name: name,
            ingredient_id: ingredientId,
            amount: scaledAmount,
            original_name: name
          })
        }
      }
    }
  }
  return Array.from(ingredientMap.values()).map(item => ({
    ...item,
    amount: Math.round(item.amount * 10) / 10,
    is_replaced: !!replacedIngredients.value[item.ingredient_name],
    replaced_with: replacedIngredients.value[item.ingredient_name]?.name
  }))
})

const toggleFavorite = async () => {
  try {
    await favoritesStore.toggle(route.params.id)
    isFavorite.value = !isFavorite.value
    ElMessage.success(isFavorite.value ? '已收藏' : '已取消收藏')
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  }
}

const openRatingDialog = () => {
  ratingForm.rating = userRating.rating || 0
  ratingForm.comment = userRating.comment || ''
  showRatingDialog.value = true
}

const submitRating = async () => {
  if (ratingForm.rating === 0) {
    ElMessage.warning('请选择评分')
    return
  }
  try {
    await ratingsStore.rate(route.params.id, {
      rating: ratingForm.rating,
      comment: ratingForm.comment
    })
    ElMessage.success('评分成功')
    showRatingDialog.value = false
    await loadRatings()
  } catch (err) {
    ElMessage.error(err.message || '评分失败')
  }
}

const loadRatings = async () => {
  try {
    const res = await ratingsStore.fetchRecipeRatings(route.params.id)
    const data = res.data || res
    avgRating.value = data.avg_rating || 0
    ratingCount.value = data.rating_count || 0
    ratingsList.value = data.ratings || []
    const userRate = data.user_rating
    if (userRate) {
      userRating.rating = userRate.rating
      userRating.comment = userRate.comment || ''
    }
  } catch (err) {
    console.error('加载评分失败', err)
  }
}

const loadFavoriteStatus = async () => {
  try {
    const res = await favoritesStore.checkStatus(route.params.id)
    const data = res.data || res
    isFavorite.value = data.is_favorite || false
  } catch (err) {
    console.error('加载收藏状态失败', err)
  }
}

const showReplacements = async (ingredient) => {
  if (!ingredient.ingredient_id) {
    ElMessage.warning('该食材暂不支持替换')
    return
  }
  replacements.ingredient = ingredient
  replacements.loading = true
  replacements.visible = true
  replacements.list = []
  replacements.selectedIngredient = null
  try {
    const res = await getIngredientReplacements(ingredient.ingredient_id)
    const data = res.data || res
    replacements.list = data.replacements || []
    if (replacements.list.length === 0) {
      ElMessage.info('暂无合适的替换食材')
      replacements.visible = false
    }
  } catch (err) {
    ElMessage.error(err.message || '加载替换食材失败')
    replacements.visible = false
  } finally {
    replacements.loading = false
  }
}

const applyReplacement = async () => {
  if (!replacements.selectedIngredient) {
    ElMessage.warning('请选择替换食材')
    return
  }
  try {
    const originalIngredient = replacements.ingredient
    const newIngredient = replacements.selectedIngredient
    
    const stepsCopy = JSON.parse(JSON.stringify(recipe.value.steps))
    for (const step of stepsCopy) {
      if (step.ingredients) {
        for (const ing of step.ingredients) {
          const ingName = ing.ingredient_name || ing.name
          if (ingName === originalIngredient.ingredient_name) {
            ing.original_ingredient_id = ing.ingredient_id || ing.id
            ing.ingredient_id = newIngredient.id
            ing.ingredient_name = newIngredient.name
            ing.original_name = originalIngredient.ingredient_name
          }
        }
      }
    }
    
    const res = await calculateReplacedRecipeNutrition(route.params.id, {
      steps: stepsCopy,
      replacements: {
        [originalIngredient.ingredient_id]: newIngredient.id
      }
    })
    const data = res.data || res
    
    if (data.nutrition) {
      adjustedNutrition.value = data.nutrition
    }
    
    replacedIngredients.value[originalIngredient.ingredient_name] = {
      name: newIngredient.name,
      original_name: originalIngredient.ingredient_name,
      id: newIngredient.id,
      original_id: originalIngredient.ingredient_id
    }
    
    recipe.value = {
      ...recipe.value,
      steps: stepsCopy
    }
    
    ElMessage.success(`已将「${originalIngredient.ingredient_name}」替换为「${newIngredient.name}」`)
    replacements.visible = false
    updateCharts()
  } catch (err) {
    ElMessage.error(err.message || '替换失败')
  }
}

const resetReplacements = () => {
  replacedIngredients.value = {}
  adjustedNutrition.value = null
  loadData()
  ElMessage.success('已重置所有食材替换')
}

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
    await Promise.all([
      loadRatings(),
      loadFavoriteStatus()
    ])
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

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
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

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.title-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-hint {
  font-size: 12px;
  color: #909399;
}

.ingredient-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.replaced-name {
  color: #67C23A;
  font-weight: 500;
}

.ratings-card {
  display: flex;
  flex-direction: column;
}

.ratings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rating-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.rating-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-avatar {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
}

.rating-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rating-username {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.rating-date {
  font-size: 12px;
  color: #909399;
}

.rating-comment {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.replacement-content {
  min-height: 200px;
}

.replacement-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.replacement-tip {
  font-size: 12px;
  color: #909399;
}

.replacement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.replacement-item {
  margin: 0;
  width: 100%;
}

.replacement-item :deep(.el-radio__label) {
  width: 100%;
  padding-left: 12px;
}

.replacement-item-content {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  width: 100%;
  transition: all 0.3s ease;
}

.replacement-item:hover .replacement-item-content {
  background: #ecf5ff;
  border-color: #409EFF;
}

.replacement-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.replacement-name {
  font-weight: 500;
  color: #303133;
  font-size: 15px;
}

.replacement-item-nutrition {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #606266;
}

.rating-form {
  margin-top: 16px;
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

  .title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .title-actions {
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
