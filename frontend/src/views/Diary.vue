<template>
  <div class="diary-page">
    <div class="page-header">
      <h2 class="page-title">饮食日记</h2>
    </div>

    <div v-loading="loading" class="content-wrapper">
      <div class="card date-selector-card">
        <div class="date-nav">
          <el-button @click="changeDate(-1)" :disabled="isSelectedToday">
            <el-icon><ArrowLeft /></el-icon>
            前一天
          </el-button>
          <el-date-picker
              v-model="selectedDate"
              type="date"
              :editable="false"
              @change="loadDiary"
              size="large"
              value-format="YYYY-MM-DD"
            />
          <el-button @click="goToday" :disabled="isSelectedToday">
            今天
          </el-button>
          <el-button @click="changeDate(1)" :disabled="isSelectedFuture">
            后一天
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="summary-card" :class="summaryStatus">
        <div class="summary-header">
          <h3 class="summary-title">{{ selectedDateLabel }}饮食摘要</h3>
          <el-tag :type="statusTagType" size="large">
            {{ statusText }}
          </el-tag>
        </div>

        <div class="summary-status-bar">
          <div class="summary-metrics">
            <div class="summary-metric">
              <span class="metric-label">实际摄入</span>
              <span class="metric-value actual">{{ summary.total.calories }}</span>
              <span class="metric-unit">kcal</span>
            </div>
            <div class="metric-divider">/</div>
            <div class="summary-metric">
              <span class="metric-label">目标摄入</span>
              <span class="metric-value target">{{ targets.calories }}</span>
              <span class="metric-unit">kcal</span>
            </div>
            <div class="metric-divider">|</div>
            <div class="summary-metric">
              <span class="metric-label">完成度</span>
              <span class="metric-value" :class="statusColor">{{ completionPercent }}%</span>
            </div>
          </div>

          <el-progress
            :percentage="completionPercent"
            :color="statusColor"
            :stroke-width="12"
            :show-text="false"
          />

          <div class="nutrient-summary">
            <div class="nutrient-item">
              <span class="nutrient-label">蛋白质</span>
              <span class="nutrient-value" :class="getNutrientStatus('protein')">
                {{ summary.total.protein }} / {{ targets.protein }} g
              </span>
            </div>
            <div class="nutrient-item">
              <span class="nutrient-label">脂肪</span>
              <span class="nutrient-value" :class="getNutrientStatus('fat')">
                {{ summary.total.fat }} / {{ targets.fat }} g
              </span>
            </div>
            <div class="nutrient-item">
              <span class="nutrient-label">碳水化合物</span>
              <span class="nutrient-value" :class="getNutrientStatus('carbs')">
                {{ summary.total.carbs }} / {{ targets.carbs }} g
              </span>
            </div>
          </div>
        </div>
      </div>

        <div class="card add-item-card">
          <div class="section-header">
            <h3 class="section-title">添加饮食记录</h3>
            <div class="add-tabs">
              <el-radio-group v-model="addMode" size="default">
                <el-radio-button value="recipe">从食谱选择</el-radio-button>
                <el-radio-button value="manual">手动输入</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <div v-if="addMode === 'recipe'" class="recipe-select-section">
            <el-select
              v-model="selectedRecipe"
              placeholder="选择食谱"
              filterable
              style="width: 100%; margin-bottom: 12px;"
            >
              <el-option
                v-for="recipe in recipeList"
                :key="recipe.id"
                :label="recipe.name + ' (' + recipe.category + ')'"
                :value="recipe.id"
              />
            </el-select>
            
            <div v-if="selectedRecipe" class="servings-input">
              <span class="input-label">食用份数：</span>
              <el-input-number
                v-model="recipeServings"
                :min="0.5"
                :max="10"
                :step="0.5"
              />
              <el-button type="primary" @click="addRecipeItem">
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
            </div>
          </div>

          <div v-if="addMode === 'manual'" class="manual-input-section">
            <div class="manual-form">
              <el-input
                v-model="manualName"
                placeholder="食材/菜肴名称"
                style="width: 200px; margin-right: 12px;"
              />
              <el-input-number
                v-model="manualAmount"
                :min="1"
                :max="2000"
                :step="10"
                placeholder="克数"
                style="margin-right: 12px;"
              />
              <span class="input-label">g</span>
              <el-button type="primary" @click="addManualItem">
                <el-icon><Plus /></el-icon>
                添加
              </el-button>
            </div>
            <div class="manual-nutrition" v-if="manualName">
              <span class="hint">提示：手动输入会自动计算营养成分</span>
            </div>
          </div>
        </div>

      <div class="card items-card">
        <div class="section-header">
          <h3 class="section-title">今日记录</h3>
          <span class="record-count">共 {{ diaryItems.length }} 条记录</span>
        </div>

        <el-table :data="diaryItems" stripe v-if="diaryItems.length > 0">
          <el-table-column prop="item_name" label="食物名称" min-width="200" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.item_type === 'recipe' ? 'primary' : 'success'" size="small">
                {{ row.item_type === 'recipe' ? '食谱' : '手动' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="份量" width="120" align="right">
            <template #default="{ row }">
              {{ row.amount }} g
            </template>
          </el-table-column>
          <el-table-column label="热量" width="100" align="right">
            <template #default="{ row }">
              <span class="calories-text">{{ row.calories }} kcal</span>
            </template>
          </el-table-column>
          <el-table-column label="蛋白质" width="100" align="right">
            <template #default="{ row }">
              {{ row.protein }} g
            </template>
          </el-table-column>
          <el-table-column label="脂肪" width="100" align="right">
            <template #default="{ row }">
              {{ row.fat }} g
            </template>
          </el-table-column>
          <el-table-column label="碳水" width="100" align="right">
            <template #default="{ row }">
              {{ row.carbs }} g
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                type="danger"
                link
                size="small"
                @click="deleteItem(row)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-else description="今日还没有饮食记录" :image-size="80">
          <el-button type="primary" @click="focusInput">
            <el-icon><Plus /></el-icon>
            添加第一条记录
          </el-button>
        </el-empty>
      </div>

      <div class="card history-card">
        <h3 class="section-title">历史记录</h3>
        <div class="history-list">
          <div
            v-for="item in historyList"
            :key="item.date"
            class="history-item"
            :class="{ active: item.date === selectedDate }"
            @click="selectHistoryDate(item)"
          >
            <div class="history-date">
              <span class="date-day">{{ getDayOfWeek(item.date) }}</span>
              <span class="date-full">{{ item.date }}</span>
            </div>
            <div class="history-summary">
              <div class="history-calories">
                <span class="calories-num">{{ item.total_calories }}</span>
                <span class="calories-unit">kcal</span>
              </div>
              <el-tag
                :type="item.status === 'excess' ? 'danger' : item.status === 'deficit' ? 'warning' : 'success'"
                size="small"
              >
                {{ item.status === 'excess' ? '超出' : item.status === 'deficit' ? '不足' : '达标' }}
              </el-tag>
            </div>
            <div class="history-progress">
              <el-progress
                :percentage="Math.min(item.completion_percent || 0, 100)"
                :color="item.status === 'excess' ? '#F56C6C' : item.status === 'deficit' ? '#E6A23C' : '#67C23A'"
                :stroke-width="6"
                :show-text="false"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Delete
} from '@element-plus/icons-vue'
import { useDiaryStore, useUserStore, useRecipesStore } from '@/store'

function formatDate(date, pattern) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (pattern === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`
  }
  if (pattern === 'M月d日') {
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
  return d.toLocaleDateString('zh-CN')
}

function addDays(date, delta) {
  const d = new Date(date)
  d.setDate(d.getDate() + delta)
  return d
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const router = useRouter()
const diaryStore = useDiaryStore()
const userStore = useUserStore()
const recipesStore = useRecipesStore()

const loading = ref(false)
const selectedDate = ref(formatDate(new Date(), 'yyyy-MM-dd'))
const addMode = ref('recipe')
const selectedRecipe = ref(null)
const recipeServings = ref(1)
const manualName = ref('')
const manualAmount = ref(100)
const recipeList = ref([])

const diaryItems = ref([])
const summary = reactive({
  total: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  },
  status: 'normal'
})

const historyList = ref([])

const targets = reactive({
  calories: 2000,
  protein: 60,
  fat: 65,
  carbs: 300
})

const isSelectedToday = computed(() => {
  const today = formatDate(new Date(), 'yyyy-MM-dd')
  return selectedDate.value === today
})

const isSelectedFuture = computed(() => {
  const today = startOfDay(new Date())
  const selected = startOfDay(new Date(selectedDate.value))
  return selected > today
})

const selectedDateLabel = computed(() => {
  if (isSelectedToday.value) return '今天'
  const date = new Date(selectedDate.value)
  return formatDate(date, 'M月d日')
})

const completionPercent = computed(() => {
  if (targets.calories === 0) return 0
  return Math.round((summary.total.calories / targets.calories) * 100)
})

const summaryStatus = computed(() => {
  return `status-${summary.status}`
})

const statusColor = computed(() => {
  if (summary.status === 'excess') return '#F56C6C'
  if (summary.status === 'deficit') return '#E6A23C'
  return '#67C23A'
})

const statusTagType = computed(() => {
  if (summary.status === 'excess') return 'danger'
  if (summary.status === 'deficit') return 'warning'
  return 'success'
})

const statusText = computed(() => {
  if (summary.status === 'excess') return '热量超出'
  if (summary.status === 'deficit') return '热量不足'
  return '热量达标'
})

const getNutrientStatus = (nutrient) => {
  const actual = summary.total[nutrient] || 0
  const target = targets[nutrient] || 1
  const ratio = actual / target
  if (ratio > 1.1) return 'excess'
  if (ratio < 0.9) return 'deficit'
  return 'normal'
}

const getDayOfWeek = (dateStr) => {
  const date = new Date(dateStr)
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[date.getDay()]
}

const changeDate = (delta) => {
  const current = new Date(selectedDate.value)
  const newDate = addDays(current, delta)
  selectedDate.value = formatDate(newDate, 'yyyy-MM-dd')
}

const goToday = () => {
  selectedDate.value = formatDate(new Date(), 'yyyy-MM-dd')
}

const selectHistoryDate = (item) => {
  selectedDate.value = item.date
}

const addRecipeItem = async () => {
  if (!selectedRecipe.value) {
    ElMessage.warning('请选择食谱')
    return
  }
  try {
    const recipe = recipeList.value.find(r => r.id === selectedRecipe.value)
    if (recipe) {
      await diaryStore.addItem({
        date: selectedDate.value,
        item_type: 'recipe',
        recipe_id: recipe.id,
        item_name: recipe.name,
        servings: recipeServings.value
      })
      ElMessage.success(`已添加「${recipe.name}」`)
      selectedRecipe.value = null
      recipeServings.value = 1
      await loadDiary()
    }
  } catch (err) {
    ElMessage.error(err.message || '添加失败')
  }
}

const addManualItem = async () => {
  if (!manualName.value.trim()) {
    ElMessage.warning('请输入食物名称')
    return
  }
  if (manualAmount.value <= 0) {
    ElMessage.warning('请输入有效的克数')
    return
  }
  try {
    await diaryStore.addItem({
      date: selectedDate.value,
      item_type: 'manual',
      item_name: manualName.value.trim(),
      amount: manualAmount.value
    })
    ElMessage.success(`已添加「${manualName.value}」`)
    manualName.value = ''
    manualAmount.value = 100
    await loadDiary()
  } catch (err) {
    ElMessage.error(err.message || '添加失败')
  }
}

const deleteItem = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除「${item.item_name}」吗？`,
      '确认删除',
      { type: 'warning' }
    )
    await diaryStore.deleteItem(item.id)
    ElMessage.success('删除成功')
    await loadDiary()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '删除失败')
    }
  }
}

const loadDiary = async () => {
  loading.value = true
  try {
    const res = await diaryStore.fetchDiary(selectedDate.value)
    const data = res.data || res
    diaryItems.value = data.items || []
    if (data.summary) {
      Object.assign(summary, data.summary)
    }
    await loadHistory()
  } catch (err) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const loadHistory = async () => {
  try {
    const res = await diaryStore.fetchHistory()
    const data = res.data || res
    historyList.value = data.history || []
  } catch (err) {
    console.error('加载历史记录失败', err)
  }
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

const loadRecipes = async () => {
  try {
    await recipesStore.fetchList()
    recipeList.value = recipesStore.list || []
  } catch (err) {
    console.error('加载食谱列表失败', err)
  }
}

const focusInput = () => {
  addMode.value = 'recipe'
}

watch(selectedDate, () => {
  loadDiary()
})

onMounted(() => {
  Promise.all([
    loadTargets(),
    loadRecipes(),
    loadDiary()
  ])
})
</script>

<style scoped>
.diary-page {
  min-height: 100vh;
  background: #f5f7fa;
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

.date-selector-card {
  display: flex;
  justify-content: center;
}

.date-nav {
  display: flex;
  gap: 16px;
  align-items: center;
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

.record-count {
  font-size: 13px;
  color: #909399;
}

.summary-card {
  border-left: 4px solid #67C23A;
}

.summary-card.status-excess {
  border-left-color: #F56C6C;
}

.summary-card.status-deficit {
  border-left-color: #E6A23C;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.summary-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.summary-metrics {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 16px;
}

.summary-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.metric-value.actual {
  color: #303133;
}

.metric-value.target {
  color: #909399;
  font-size: 24px;
}

.metric-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
}

.metric-divider {
  font-size: 24px;
  color: #dcdfe6;
  font-weight: 300;
}

.nutrient-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.nutrient-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nutrient-label {
  font-size: 13px;
  color: #606266;
}

.nutrient-value {
  font-weight: 500;
}

.nutrient-value.excess {
  color: #F56C6C;
}

.nutrient-value.deficit {
  color: #E6A23C;
}

.nutrient-value.normal {
  color: #67C23A;
}

.add-tabs {
  display: flex;
  gap: 12px;
}

.recipe-select-section,
.manual-input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.servings-input,
.manual-form {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-label {
  font-size: 14px;
  color: #606266;
}

.manual-nutrition {
  margin-top: 8px;
}

.manual-hint {
  font-size: 12px;
  color: #909399;
}

.calories-text {
  font-weight: 600;
  color: #409EFF;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: grid;
  grid-template-columns: 120px 1fr 200px;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.history-item:hover {
  background: #ecf5ff;
  border-color: #d9ecff;
}

.history-item.active {
  background: #ecf5ff;
  border-color: #409EFF;
}

.history-date {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-day {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.date-full {
  font-size: 12px;
  color: #909399;
}

.history-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-calories {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.calories-num {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.calories-unit {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 1200px) {
  .nutrient-summary {
    grid-template-columns: 1fr;
  }

  .history-item {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .date-nav {
    flex-wrap: wrap;
    justify-content: center;
  }

  .summary-metrics {
    flex-wrap: wrap;
    gap: 12px;
  }

  .servings-input,
  .manual-form {
    flex-wrap: wrap;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
