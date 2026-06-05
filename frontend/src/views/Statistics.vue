<template>
  <div class="statistics-page">
    <div class="page-header">
      <h2 class="page-title">营养统计</h2>
      <div class="header-actions">
        <el-radio-group v-model="timeRange" size="large" @change="loadStatistics">
          <el-radio-button value="7">最近7天</el-radio-button>
          <el-radio-button value="30">最近30天</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div v-loading="loading" class="content-wrapper">
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon calories-icon">
            <el-icon :size="28"><Star /></el-icon>
          </div>
          <div class="card-content">
            <span class="card-label">平均热量</span>
            <span class="card-value">{{ summary.avgCalories }}</span>
            <span class="card-unit">kcal/天</span>
            <div class="card-compare">
              <span :class="summary.caloriesStatus">{{ summary.caloriesCompare }}</span>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon protein-icon">
            <el-icon :size="28"><Dish /></el-icon>
          </div>
          <div class="card-content">
            <span class="card-label">平均蛋白质</span>
            <span class="card-value">{{ summary.avgProtein }}</span>
            <span class="card-unit">g/天</span>
            <div class="card-compare">
              <span :class="summary.proteinStatus">{{ summary.proteinCompare }}</span>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon fat-icon">
            <el-icon :size="28"><User /></el-icon>
          </div>
          <div class="card-content">
            <span class="card-label">平均脂肪</span>
            <span class="card-value">{{ summary.avgFat }}</span>
            <span class="card-unit">g/天</span>
            <div class="card-compare">
              <span :class="summary.fatStatus">{{ summary.fatCompare }}</span>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon carbs-icon">
            <el-icon :size="28"><Food /></el-icon>
          </div>
          <div class="card-content">
            <span class="card-label">平均碳水</span>
            <span class="card-value">{{ summary.avgCarbs }}</span>
            <span class="card-unit">g/天</span>
            <div class="card-compare">
              <span :class="summary.carbsStatus">{{ summary.carbsCompare }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card chart-card">
        <div class="section-header">
          <h3 class="section-title">每日营养摄入趋势</h3>
          <span class="section-hint">显示最近{{ timeRange }}天的营养摄入变化</span>
        </div>
        <div id="trendChart" class="chart-container"></div>
      </div>

      <div class="card chart-card">
        <div class="section-header">
          <h3 class="section-title">宏量营养素比例分析</h3>
          <span class="section-hint">实际比例 vs 推荐比例(蛋白质40% 脂肪30% 碳水30%)</span>
        </div>
        <div id="macroChart" class="chart-container"></div>
      </div>

      <div class="card ratio-card">
        <h3 class="section-title">详细比例数据</h3>
        <div class="ratio-grid">
          <div class="ratio-item">
            <div class="ratio-header">
              <span class="ratio-name">蛋白质</span>
              <span class="ratio-target">推荐 40%</span>
            </div>
            <el-progress
              :percentage="macroRatio.actual.protein"
              :color="'#67C23A'"
              :stroke-width="10"
            />
            <div class="ratio-footer">
              <span class="ratio-actual">实际 {{ macroRatio.actual.protein }}%</span>
              <span class="ratio-diff" :class="getDiffClass(macroRatio.actual.protein, 40)">
                {{ getDiffText(macroRatio.actual.protein, 40) }}
              </span>
            </div>
          </div>

          <div class="ratio-item">
            <div class="ratio-header">
              <span class="ratio-name">脂肪</span>
              <span class="ratio-target">推荐 30%</span>
            </div>
            <el-progress
              :percentage="macroRatio.actual.fat"
              :color="'#E6A23C'"
              :stroke-width="10"
            />
            <div class="ratio-footer">
              <span class="ratio-actual">实际 {{ macroRatio.actual.fat }}%</span>
              <span class="ratio-diff" :class="getDiffClass(macroRatio.actual.fat, 30)">
                {{ getDiffText(macroRatio.actual.fat, 30) }}
              </span>
            </div>
          </div>

          <div class="ratio-item">
            <div class="ratio-header">
              <span class="ratio-name">碳水化合物</span>
              <span class="ratio-target">推荐 30%</span>
            </div>
            <el-progress
              :percentage="macroRatio.actual.carbs"
              :color="'#F56C6C'"
              :stroke-width="10"
            />
            <div class="ratio-footer">
              <span class="ratio-actual">实际 {{ macroRatio.actual.carbs }}%</span>
              <span class="ratio-diff" :class="getDiffClass(macroRatio.actual.carbs, 30)">
                {{ getDiffText(macroRatio.actual.carbs, 30) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="card tips-card">
        <el-alert
          :title="getRecommendation()"
          type="info"
          :closable="false"
          show-icon
        >
          <template #icon>
            <el-icon><InfoFilled /></el-icon>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useStatisticsStore, useUserStore } from '@/store'
import { ElMessage } from 'element-plus'
import { Star, Dish, User, Food, InfoFilled } from '@element-plus/icons-vue'

const statisticsStore = useStatisticsStore()
const userStore = useUserStore()

const loading = ref(false)
const timeRange = ref('7')
let trendChart = null
let macroChart = null

const summary = reactive({
  avgCalories: 0,
  avgProtein: 0,
  avgFat: 0,
  avgCarbs: 0,
  caloriesStatus: 'normal',
  proteinStatus: 'normal',
  fatStatus: 'normal',
  carbsStatus: 'normal',
  caloriesCompare: '',
  proteinCompare: '',
  fatCompare: '',
  carbsCompare: ''
})

const macroRatio = reactive({
  actual: {
    protein: 0,
    fat: 0,
    carbs: 0
  },
  target: {
    protein: 40,
    fat: 30,
    carbs: 30
  }
})

const targets = reactive({
  calories: 2000,
  protein: 60,
  fat: 65,
  carbs: 300
})

const trendData = ref({
  dates: [],
  calories: [],
  protein: [],
  fat: []
})

const getDiffClass = (actual, target) => {
  const diff = actual - target
  if (Math.abs(diff) <= 5) return 'normal'
  if (diff > 5) return 'excess'
  return 'deficit'
}

const getDiffText = (actual, target) => {
  const diff = actual - target
  if (diff > 0) return `+${diff.toFixed(1)}%`
  if (diff < 0) return `${diff.toFixed(1)}%`
  return '正好'
}

const getRecommendation = () => {
  const proteinDiff = macroRatio.actual.protein - 40
  const fatDiff = macroRatio.actual.fat - 30
  const carbsDiff = macroRatio.actual.carbs - 30

  const tips = []
  if (proteinDiff < -5) {
    tips.push('蛋白质摄入偏低，建议增加鱼、禽、蛋、瘦肉等优质蛋白质食物')
  } else if (proteinDiff > 5) {
    tips.push('蛋白质摄入偏高，注意适量控制，保持均衡饮食')
  }

  if (fatDiff > 5) {
    tips.push('脂肪摄入偏高，建议减少油炸食品和肥肉，选择低脂肪烹饪方式')
  }

  if (carbsDiff > 5) {
    tips.push('碳水化合物摄入偏高，建议选择全谷物，控制精制糖摄入')
  } else if (carbsDiff < -5) {
    tips.push('碳水化合物摄入偏低，可适当增加全谷物和薯类摄入')
  }

  if (tips.length === 0) {
    return '您的营养素比例很均衡！继续保持良好的饮食习惯。'
  }

  return tips.join('；') + '。'
}

const initTrendChart = () => {
  const chartDom = document.getElementById('trendChart')
  if (!chartDom) return
  if (trendChart) {
    trendChart.dispose()
  }
  trendChart = echarts.init(chartDom)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['热量(kcal)', '蛋白质(g)', '脂肪(g)'],
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
      boundaryGap: false,
      data: trendData.value.dates
    },
    yAxis: [
      {
        type: 'value',
        name: '热量(kcal)',
        position: 'left'
      },
      {
        type: 'value',
        name: '重量(g)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '热量(kcal)',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        data: trendData.value.calories,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '蛋白质(g)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: trendData.value.protein,
        itemStyle: { color: '#67C23A' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      },
      {
        name: '脂肪(g)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: trendData.value.fat,
        itemStyle: { color: '#E6A23C' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
          ])
        }
      }
    ]
  }

  trendChart.setOption(option)
}

const initMacroChart = () => {
  const chartDom = document.getElementById('macroChart')
  if (!chartDom) return
  if (macroChart) {
    macroChart.dispose()
  }
  macroChart = echarts.init(chartDom)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}%'
    },
    legend: {
      data: ['实际比例', '推荐比例'],
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
      data: ['蛋白质', '脂肪', '碳水化合物']
    },
    yAxis: {
      type: 'value',
      name: '占比(%)',
      max: 60,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '实际比例',
        type: 'bar',
        barWidth: '35%',
        data: [
          { value: macroRatio.actual.protein, itemStyle: { color: '#67C23A' } },
          { value: macroRatio.actual.fat, itemStyle: { color: '#E6A23C' } },
          { value: macroRatio.actual.carbs, itemStyle: { color: '#F56C6C' } }
        ],
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '推荐比例',
        type: 'bar',
        barWidth: '35%',
        data: [40, 30, 30],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#c2e9b6' },
            { offset: 1, color: '#909399' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }

  macroChart.setOption(option)
}

const updateSummary = (data) => {
  const avgData = data.avg || {}
  summary.avgCalories = Math.round(avgData.calories || 0)
  summary.avgProtein = Math.round(avgData.protein || 0)
  summary.avgFat = Math.round(avgData.fat || 0)
  summary.avgCarbs = Math.round(avgData.carbs || 0)

  const updateCompare = (key, actual, target) => {
    const diff = actual - target
    const percent = target > 0 ? Math.round((actual / target) * 100) : 0
    if (percent > 110) {
      summary[`${key}Status`] = 'excess'
      summary[`${key}Compare`] = `超目标${percent - 100}%`
    } else if (percent < 90) {
      summary[`${key}Status`] = 'deficit'
      summary[`${key}Compare`] = `差目标${100 - percent}%`
    } else {
      summary[`${key}Status`] = 'normal'
      summary[`${key}Compare`] = '达标'
    }
  }

  updateCompare('calories', summary.avgCalories, targets.calories)
  updateCompare('protein', summary.avgProtein, targets.protein)
  updateCompare('fat', summary.avgFat, targets.fat)
  updateCompare('carbs', summary.avgCarbs, targets.carbs)
}

const updateTrendData = (data) => {
  const list = data.trend || []
  trendData.value.dates = list.map(item => item.date)
  trendData.value.calories = list.map(item => Math.round(item.calories || 0))
  trendData.value.protein = list.map(item => Math.round(item.protein || 0))
  trendData.value.fat = list.map(item => Math.round(item.fat || 0))
}

const updateMacroRatio = (data) => {
  const ratio = data.ratio || {}
  macroRatio.actual.protein = Math.round((ratio.protein || 0) * 10) / 10
  macroRatio.actual.fat = Math.round((ratio.fat || 0) * 10) / 10
  macroRatio.actual.carbs = Math.round((ratio.carbs || 0) * 10) / 10
}

const loadTargets = async () => {
  try {
    const res = await userStore.fetchTargets()
    const data = res.data || res
    if (data) {
      targets.calories = data.calories || 2000
      targets.protein = data.protein || 60
      targets.fat = data.fat || 65
      targets.carbs = data.carbs || data.carbohydrate || 300
    }
  } catch (err) {
    console.error('加载营养目标失败', err)
  }
}

const loadStatistics = async () => {
  loading.value = true
  try {
    const trendRes = await statisticsStore.fetchTrend({ days: parseInt(timeRange.value) })
    const macroRes = await statisticsStore.fetchMacroRatio({ days: parseInt(timeRange.value) })
    const summaryRes = await statisticsStore.fetchSummary({ days: parseInt(timeRange.value) })

    const trendData = trendRes.data || trendRes
    const macroData = macroRes.data || macroRes
    const summaryData = summaryRes.data || summaryRes

    updateTrendData(trendData)
    updateMacroRatio(macroData)
    updateSummary(summaryData)

    await nextTick()
    initTrendChart()
    initMacroChart()
  } catch (err) {
    ElMessage.error(err.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  trendChart?.resize()
  macroChart?.resize()
}

watch(timeRange, () => {
  loadStatistics()
})

onMounted(() => {
  Promise.all([
    loadTargets()
  ]).then(() => {
    loadStatistics()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  macroChart?.dispose()
})
</script>

<style scoped>
.statistics-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.summary-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.calories-icon {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
}

.protein-icon {
  background: linear-gradient(135deg, #67C23A, #85ce61);
}

.fat-icon {
  background: linear-gradient(135deg, #E6A23C, #ebb563);
}

.carbs-icon {
  background: linear-gradient(135deg, #F56C6C, #f78989);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.card-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.card-unit {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.card-compare {
  margin-top: 4px;
}

.card-compare span {
  font-size: 12px;
  font-weight: 500;
}

.card-compare .normal {
  color: #67C23A;
}

.card-compare .excess {
  color: #F56C6C;
}

.card-compare .deficit {
  color: #E6A23C;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.section-hint {
  font-size: 12px;
  color: #909399;
}

.chart-container {
  width: 100%;
  height: 350px;
}

.ratio-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.ratio-item {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
}

.ratio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ratio-name {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.ratio-target {
  font-size: 12px;
  color: #909399;
}

.ratio-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.ratio-actual {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.ratio-diff {
  font-size: 12px;
  font-weight: 500;
}

.ratio-diff.normal {
  color: #67C23A;
}

.ratio-diff.excess {
  color: #F56C6C;
}

.ratio-diff.deficit {
  color: #E6A23C;
}

.tips-card {
  padding: 0;
  overflow: hidden;
}

.tips-card :deep(.el-alert) {
  border-radius: 8px;
}

@media (max-width: 1200px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .ratio-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .chart-container {
    height: 300px;
  }
}
</style>
