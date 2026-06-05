<template>
  <div class="price-trends-page">
    <div class="page-header">
      <h2 class="page-title">食材价格趋势</h2>
      <p class="page-desc">追踪食材价格变化，合理规划购物预算</p>
    </div>

    <div v-loading="loading" class="content">
      <div class="card filter-card">
        <div class="filter-row">
          <div class="filter-item">
            <label>选择食材</label>
            <el-select
              v-model="selectedIngredientId"
              placeholder="请选择食材"
              style="width: 280px;"
              @change="loadPriceHistory"
            >
              <el-option
                v-for="ing in ingredients"
                :key="ing.id"
                :label="ing.name"
                :value="ing.id"
              >
                <span style="float: left">{{ ing.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">
                  ¥{{ ing.price_per_500g?.toFixed(2) || '0.00' }}/500g
                </span>
              </el-option>
            </el-select>
          </div>

          <div class="filter-item">
            <label>时间范围</label>
            <el-radio-group v-model="timeRange" @change="loadPriceHistory" size="default">
              <el-radio-button value="week">最近1周</el-radio-button>
              <el-radio-button value="month">最近1月</el-radio-button>
              <el-radio-button value="3month">最近3月</el-radio-button>
            </el-radio-group>
          </div>

          <div class="filter-item" v-if="selectedIngredientId">
            <el-button type="primary" @click="showUpdatePriceDialog">
              <el-icon><Edit /></el-icon>
              更新价格
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="selectedIngredientId && priceHistory.length > 0" class="stats-cards">
        <el-card shadow="never" class="stat-card">
          <div class="stat-icon current">
            <el-icon :size="24"><Coin /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">当前价格</span>
            <span class="stat-value">¥{{ currentPrice?.toFixed(2) || '0.00' }}</span>
            <span class="stat-unit">/500g</span>
          </div>
        </el-card>

        <el-card shadow="never" class="stat-card">
          <div class="stat-icon avg">
            <el-icon :size="24"><DataLine /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">周均价</span>
            <span class="stat-value">¥{{ weeklyAvg?.toFixed(2) || '0.00' }}</span>
            <span class="stat-unit">/500g</span>
          </div>
        </el-card>

        <el-card shadow="never" class="stat-card">
          <div class="stat-icon" :class="trendDirection">
            <el-icon :size="24">
              <component :is="trendDirection === 'up' ? 'ArrowUp' : trendDirection === 'down' ? 'ArrowDown' : 'Close'" />
            </el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">价格趋势</span>
            <span class="stat-value" :class="trendDirection">
              {{ trendDirection === 'up' ? '+' : '' }}{{ trendPercent?.toFixed(1) || '0.0' }}%
            </span>
            <span class="stat-desc">较上周</span>
          </div>
        </el-card>

        <el-card shadow="never" class="stat-card">
          <div class="stat-icon low">
            <el-icon :size="24"><ArrowDown /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">历史最低</span>
            <span class="stat-value">¥{{ minPrice?.toFixed(2) || '0.00' }}</span>
            <span class="stat-unit">/500g</span>
          </div>
        </el-card>
      </div>

      <div v-if="selectedIngredientId" class="card chart-card">
        <div class="card-header">
          <h3>价格走势</h3>
          <span class="chart-subtitle">{{ selectedIngredientName }}</span>
        </div>
        <div ref="chartRef" class="chart-container"></div>
      </div>

      <div v-if="!selectedIngredientId" class="card empty-card">
        <el-icon :size="64" color="#C0C4CC"><DataLine /></el-icon>
        <h3>请选择食材查看价格趋势</h3>
        <p style="color: #909399; margin-top: 8px;">支持按周、月、季度查看价格变化</p>
      </div>

      <div class="section-title">
        <el-icon><ShoppingCart /></el-icon>
        按预算筛选食谱
      </div>

      <div class="card budget-card">
        <div class="budget-filter">
          <div class="budget-input">
            <label>每人预算（元/餐）</label>
            <el-input-number
              v-model="budget"
              :min="0"
              :max="500"
              :step="5"
              style="width: 160px;"
              @change="loadBudgetRecipes"
            />
          </div>
          <div class="budget-input">
            <label>分类</label>
            <el-select
              v-model="budgetCategory"
              placeholder="全部分类"
              clearable
              style="width: 140px;"
              @change="loadBudgetRecipes"
            >
              <el-option label="早餐" value="早餐" />
              <el-option label="午餐" value="午餐" />
              <el-option label="晚餐" value="晚餐" />
              <el-option label="小食" value="小食" />
            </el-select>
          </div>
        </div>

        <div v-loading="budgetLoading" class="budget-recipes">
          <div v-if="budgetRecipes.length === 0" class="empty-state">
            <el-icon :size="48" color="#C0C4CC"><Search /></el-icon>
            <p>暂无符合预算的食谱</p>
          </div>
          <div
            v-for="recipe in budgetRecipes"
            :key="recipe.id"
            class="budget-recipe-item"
            @click="goToRecipe(recipe.id)"
          >
            <div class="recipe-cover-small">
              <img v-if="recipe.cover_image" :src="recipe.cover_image" :alt="recipe.name" />
              <div v-else class="cover-placeholder-small">
                <el-icon><Food /></el-icon>
              </div>
            </div>
            <div class="recipe-info">
              <h4 class="recipe-name">{{ recipe.name }}</h4>
              <div class="recipe-tags">
                <el-tag size="small" type="info">{{ recipe.category }}</el-tag>
                <span class="servings">{{ recipe.servings }}人份</span>
              </div>
              <div class="recipe-price">
                <span class="price-label">总费用:</span>
                <span class="price-value">¥{{ recipe.total_price?.toFixed(2) || '0.00' }}</span>
                <span class="price-per-serving">
                  (¥{{ recipe.price_per_serving?.toFixed(2) || '0.00' }}/人)
                </span>
              </div>
            </div>
            <div class="recipe-action">
              <el-button type="primary" size="small">
                查看详情
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="updatePriceDialogVisible" title="更新食材价格" width="480px">
      <el-form :model="priceForm" label-width="100px">
        <el-form-item label="食材名称">
          <span>{{ selectedIngredientName }}</span>
        </el-form-item>
        <el-form-item label="当前价格">
          <span>¥{{ currentPrice?.toFixed(2) || '0.00' }}/500g</span>
        </el-form-item>
        <el-form-item label="新价格" required>
          <el-input-number
            v-model="priceForm.new_price"
            :min="0"
            :max="9999"
            :step="0.5"
            :precision="2"
            style="width: 100%;"
            placeholder="请输入每500g的价格"
          />
          <span style="color: #909399; font-size: 12px; margin-left: 8px;">元/500g</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="priceForm.remark"
            type="textarea"
            :rows="2"
            placeholder="可选，记录价格变动原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="updatePriceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdatePrice" :loading="updating">
          确认更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataLine, Coin, ArrowUp, ArrowDown, Close,
  Edit, ShoppingCart, Search, Food
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getIngredients } from '@/api/ingredients'
import {
  getIngredientPriceHistory,
  updateIngredientPrice,
  getRecipesByBudget
} from '@/api/priceHistory'

const router = useRouter()

const loading = ref(false)
const budgetLoading = ref(false)
const ingredients = ref([])
const selectedIngredientId = ref(null)
const timeRange = ref('week')
const priceHistory = ref([])

const currentPrice = computed(() => {
  if (priceHistory.value.length === 0) return null
  return priceHistory.value[priceHistory.value.length - 1].price_per_500g
})

const weeklyAvg = computed(() => {
  if (priceHistory.value.length === 0) return null
  const prices = priceHistory.value.map(p => p.price_per_500g)
  return prices.reduce((a, b) => a + b, 0) / prices.length
})

const minPrice = computed(() => {
  if (priceHistory.value.length === 0) return null
  return Math.min(...priceHistory.value.map(p => p.price_per_500g))
})

const trendPercent = computed(() => {
  if (priceHistory.value.length < 2) return 0
  const first = priceHistory.value[0].price_per_500g
  const last = priceHistory.value[priceHistory.value.length - 1].price_per_500g
  if (first === 0) return 0
  return ((last - first) / first) * 100
})

const trendDirection = computed(() => {
  if (trendPercent.value > 0.5) return 'up'
  if (trendPercent.value < -0.5) return 'down'
  return 'stable'
})

const selectedIngredientName = computed(() => {
  const ing = ingredients.value.find(i => i.id === selectedIngredientId.value)
  return ing?.name || ''
})

const budget = ref(20)
const budgetCategory = ref('')
const budgetRecipes = ref([])

const updatePriceDialogVisible = ref(false)
const updating = ref(false)
const priceForm = ref({
  new_price: 0,
  remark: ''
})

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const dates = priceHistory.value.map(p => p.week || p.record_date)
  const prices = priceHistory.value.map(p => p.avg_price || p.price_per_500g)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        return `<div style="padding: 4px 8px;">
          <div style="font-weight: 500; margin-bottom: 4px;">${data.name}</div>
          <div>价格: <span style="color: #409EFF; font-weight: 600;">¥${data.value.toFixed(2)}</span>/500g</div>
        </div>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: {
        lineStyle: { color: '#e4e7ed' }
      },
      axisLabel: {
        color: '#606266'
      }
    },
    yAxis: {
      type: 'value',
      name: '价格(元/500g)',
      nameTextStyle: {
        color: '#909399',
        fontSize: 12
      },
      axisLine: {
        lineStyle: { color: '#e4e7ed' }
      },
      axisLabel: {
        color: '#606266',
        formatter: (value) => '¥' + value.toFixed(1)
      },
      splitLine: {
        lineStyle: { color: '#f2f6fc', type: 'dashed' }
      }
    },
    series: [
      {
        name: '价格',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]
          }
        },
        itemStyle: {
          color: '#409EFF',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
            ]
          }
        },
        data: prices
      }
    ]
  }

  chartInstance.setOption(option)
}

const loadIngredients = async () => {
  loading.value = true
  try {
    const res = await getIngredients({ page_size: 1000 })
    const data = res.data || res
    ingredients.value = data.list || data || []
  } catch (error) {
    ElMessage.error(error.message || '加载食材列表失败')
  } finally {
    loading.value = false
  }
}

const loadPriceHistory = async () => {
  if (!selectedIngredientId.value) return
  loading.value = true
  try {
    const params = {
      range: timeRange.value
    }
    const res = await getIngredientPriceHistory(selectedIngredientId.value, params)
    const data = res.data || res
    priceHistory.value = data.price_history || data.history || []
    await nextTick()
    initChart()
  } catch (error) {
    ElMessage.error(error.message || '加载价格历史失败')
  } finally {
    loading.value = false
  }
}

const loadBudgetRecipes = async () => {
  budgetLoading.value = true
  try {
    const params = {
      budget_per_serving: budget.value,
      page_size: 20
    }
    if (budgetCategory.value) {
      params.category = budgetCategory.value
    }
    const res = await getRecipesByBudget(params)
    const data = res.data || res
    budgetRecipes.value = data.list || data || []
  } catch (error) {
    ElMessage.error(error.message || '加载食谱失败')
  } finally {
    budgetLoading.value = false
  }
}

const showUpdatePriceDialog = () => {
  priceForm.value.new_price = currentPrice.value || 0
  priceForm.value.remark = ''
  updatePriceDialogVisible.value = true
}

const handleUpdatePrice = async () => {
  if (!selectedIngredientId.value) return
  if (priceForm.value.new_price <= 0) {
    ElMessage.warning('请输入有效的价格')
    return
  }
  updating.value = true
  try {
    await updateIngredientPrice(selectedIngredientId.value, {
      price_per_500g: priceForm.value.new_price,
      remark: priceForm.value.remark
    })
    ElMessage.success('价格更新成功')
    updatePriceDialogVisible.value = false
    loadIngredients()
    loadPriceHistory()
  } catch (error) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    updating.value = false
  }
}

const goToRecipe = (id) => {
  router.push(`/recipes/${id}`)
}

window.addEventListener('resize', () => {
  chartInstance?.resize()
})

onMounted(() => {
  loadIngredients()
  loadBudgetRecipes()
})

watch(selectedIngredientId, () => {
  if (selectedIngredientId.value) {
    loadPriceHistory()
  }
})
</script>

<style scoped>
.page-desc {
  color: #909399;
  margin: 8px 0 0 0;
  font-size: 14px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.filter-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.filter-card :deep(.el-select .el-input__wrapper),
.filter-card :deep(.el-radio-button__inner) {
  color: #303133;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 32px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-size: 14px;
  font-weight: 500;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.stat-icon.current {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.avg {
  background: linear-gradient(135deg, #409EFF 0%, #36a3f7 100%);
}

.stat-icon.up {
  background: linear-gradient(135deg, #F56C6C 0%, #f89898 100%);
}

.stat-icon.down {
  background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%);
}

.stat-icon.stable {
  background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
}

.stat-icon.low {
  background: linear-gradient(135deg, #E6A23C 0%, #f0c78a 100%);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.stat-value.up {
  color: #F56C6C;
}

.stat-value.down {
  color: #67C23A;
}

.stat-value.stable {
  color: #909399;
}

.stat-unit {
  font-size: 12px;
  color: #909399;
}

.stat-desc {
  font-size: 12px;
  color: #909399;
}

.chart-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-card h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.chart-subtitle {
  color: #909399;
  font-size: 14px;
}

.chart-container {
  width: 100%;
  height: 360px;
}

.empty-card {
  text-align: center;
  padding: 60px 24px;
}

.empty-card h3 {
  margin: 16px 0 0 0;
  color: #606266;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-top: 8px;
}

.budget-filter {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.budget-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.budget-input label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.budget-recipes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.budget-recipe-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.budget-recipe-item:hover {
  background: #ecf5ff;
}

.recipe-cover-small {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.recipe-cover-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder-small {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.recipe-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recipe-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.recipe-tags {
  display: flex;
  align-items: center;
  gap: 12px;
}

.servings {
  font-size: 13px;
  color: #909399;
}

.recipe-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-label {
  font-size: 13px;
  color: #909399;
}

.price-value {
  font-size: 20px;
  font-weight: 700;
  color: #F56C6C;
}

.price-per-serving {
  font-size: 13px;
  color: #67C23A;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.recipe-action {
  flex-shrink: 0;
}
</style>
