<template>
  <div class="suggestions-page">
    <div class="page-header">
      <h2 class="page-title">智能膳食建议</h2>
      <p class="page-desc">基于您的体质档案和饮食记录，为您提供个性化营养建议</p>
    </div>

    <div v-loading="loading" class="content">
      <div v-if="!suggestions.has_data && suggestions.message" class="card no-data-card">
        <el-icon :size="64" color="#C0C4CC" style="margin-bottom: 16px;"><Warning /></el-icon>
        <h3>{{ suggestions.message }}</h3>
        <p style="color: #909399; margin-top: 8px;">请先记录至少7天的饮食日记以获取准确的个性化建议</p>
        <el-button type="primary" style="margin-top: 24px;" @click="goToDiary">
          去记录饮食日记
        </el-button>
      </div>

      <div v-else>
        <div class="card user-card">
          <div class="user-info">
            <el-avatar :size="64" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
            <div class="user-detail">
              <h3 class="username">{{ suggestions.user?.nickname || suggestions.user?.username || '用户' }}</h3>
              <div class="user-stats">
                <span class="stat">
                  <el-icon><Coin /></el-icon>
                  身高: {{ suggestions.user?.height || '--' }} cm
                </span>
                <span class="stat">
                  <el-icon><Goods /></el-icon>
                  体重: {{ suggestions.user?.weight || '--' }} kg
                </span>
                <span class="stat">
                  <el-icon><Setting /></el-icon>
                  TDEE: {{ suggestions.user?.tdee || '--' }} kcal
                </span>
              </div>
            </div>
          </div>
          <div class="date-info">
            <span class="label">分析周期</span>
            <span class="value">{{ suggestions.intake_summary?.start_date }} ~ {{ suggestions.intake_summary?.end_date }}</span>
            <span class="days">共 {{ suggestions.intake_summary?.days_count }} 天</span>
          </div>
        </div>

        <div class="section-title">
          <el-icon><DataLine /></el-icon>
          营养缺口分析
        </div>

        <div class="nutrient-cards">
          <el-card
            v-for="gap in suggestions.nutrient_gaps"
            :key="gap.nutrient"
            :class="['nutrient-card', gap.status]"
            shadow="never"
          >
            <div class="nutrient-header">
              <span class="nutrient-name">{{ gap.name }}</span>
              <el-tag :type="getStatusTagType(gap.status)" size="small" effect="light">
                {{ getStatusText(gap.status) }}
              </el-tag>
            </div>
            <div class="nutrient-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :class="gap.status"
                  :style="{ width: Math.min(gap.percent, 120) + '%' }"
                ></div>
                <div class="target-line" style="left: 100%;"></div>
              </div>
              <div class="progress-labels">
                <span class="actual">{{ gap.actual }} {{ gap.unit }}</span>
                <span class="target">目标: {{ gap.target }} {{ gap.unit }}</span>
              </div>
            </div>
            <div class="nutrient-detail">
              <span v-if="gap.status === 'deficit'" class="deficit">
                缺口: {{ gap.deficit }} {{ gap.unit }} ({{ Math.abs(gap.percent - 100) }}%)
              </span>
              <span v-else-if="gap.status === 'excess'" class="excess">
                过量: {{ Math.abs(gap.deficit) }} {{ gap.unit }} ({{ gap.percent - 100 }}%)
              </span>
              <span v-else class="normal">达标</span>
            </div>
          </el-card>
        </div>

        <div v-if="suggestions.daily_suggestions && suggestions.daily_suggestions.length > 0" class="section-title">
          <el-icon><DataAnalysis /></el-icon>
          每日改进建议
        </div>

        <div v-if="suggestions.daily_suggestions && suggestions.daily_suggestions.length > 0" class="suggestion-cards">
          <el-card
            v-for="(suggestion, index) in suggestions.daily_suggestions"
            :key="index"
            :class="['suggestion-card', suggestion.type]"
            shadow="hover"
          >
            <div class="suggestion-icon">
              <el-icon v-if="suggestion.type === 'warning'" :size="28"><Warning /></el-icon>
              <el-icon v-else :size="28"><Close /></el-icon>
            </div>
            <div class="suggestion-content">
              <h4 class="suggestion-title">{{ suggestion.nutrient }} {{ suggestion.type === 'warning' ? '摄入偏低' : '摄入偏高' }}</h4>
              <p class="suggestion-desc">{{ suggestion.message }}</p>
              <div class="suggestion-numbers">
                <span>当前: {{ suggestion.actual }} {{ suggestion.unit }} ({{ suggestion.percent }}%)</span>
                <span>目标: {{ suggestion.target }} {{ suggestion.unit }}</span>
              </div>
            </div>
          </el-card>
        </div>

        <div v-if="suggestions.recommended_recipes && suggestions.recommended_recipes.length > 0" class="section-title">
          <el-icon><Food /></el-icon>
          为您推荐的食谱
        </div>

        <div v-if="suggestions.recommended_recipes && suggestions.recommended_recipes.length > 0" class="recipes-grid">
          <el-card
            v-for="recipe in suggestions.recommended_recipes"
            :key="recipe.id"
            shadow="hover"
            class="recipe-card"
            @click="goToRecipe(recipe.id)"
          >
            <div class="recipe-cover">
              <img v-if="recipe.cover_image" :src="recipe.cover_image" :alt="recipe.name" />
              <div v-else class="cover-placeholder">
                <el-icon :size="36"><Food /></el-icon>
              </div>
            </div>
            <div class="recipe-content">
              <h4 class="recipe-name">{{ recipe.name }}</h4>
              <div class="recipe-meta">
                <el-tag size="small" type="info">{{ recipe.category }}</el-tag>
                <span class="servings">{{ recipe.servings }} 人份</span>
              </div>
              <div class="recipe-stats">
                <span class="stat">
                  <el-icon color="#E6A23C"><Star fill="#E6A23C" /></el-icon>
                  {{ recipe.avg_rating || 0 }}
                </span>
                <span class="stat">
                  <el-icon><Star /></el-icon>
                  {{ recipe.favorite_count || 0 }} 收藏
                </span>
              </div>
              <div class="nutrient-highlight">
                <span class="highlight-label">推荐理由:</span>
                <span class="highlight-value">富含 {{ getPriorityNutrient() }}</span>
              </div>
            </div>
          </el-card>
        </div>

        <div class="refresh-section">
          <el-button type="primary" @click="loadSuggestions" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新建议
          </el-button>
          <span class="refresh-time">上次更新: {{ formatTime(suggestions.generated_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataLine, DataAnalysis, Food, Warning, Refresh, Coin, Goods, Close, Setting } from '@element-plus/icons-vue'
import { getDailySuggestions } from '@/api/suggestions'

const router = useRouter()
const loading = ref(false)
const suggestions = ref({
  has_data: false,
  message: '',
  user: null,
  nutrient_gaps: [],
  daily_suggestions: [],
  recommended_recipes: [],
  intake_summary: null,
  generated_at: null
})

const getStatusTagType = (status) => {
  const typeMap = {
    deficit: 'warning',
    excess: 'danger',
    normal: 'success'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    deficit: '偏低',
    excess: '偏高',
    normal: '正常'
  }
  return textMap[status] || '正常'
}

const getPriorityNutrient = () => {
  const deficitGaps = suggestions.value.nutrient_gaps?.filter(g => g.status === 'deficit') || []
  if (deficitGaps.length > 0) {
    return deficitGaps[0].name
  }
  const excessGaps = suggestions.value.nutrient_gaps?.filter(g => g.status === 'excess') || []
  if (excessGaps.length > 0) {
    return '低' + excessGaps[0].name + '食材'
  }
  return '优质蛋白'
}

const formatTime = (time) => {
  if (!time) return '--'
  return new Date(time).toLocaleString('zh-CN')
}

const loadSuggestions = async () => {
  loading.value = true
  try {
    const res = await getDailySuggestions()
    const data = res.data || res
    suggestions.value = {
      ...data,
      has_data: !!data.has_data,
      message: data.message || ''
    }
  } catch (error) {
    ElMessage.error(error.message || '加载建议失败')
  } finally {
    loading.value = false
  }
}

const goToDiary = () => {
  router.push('/diary')
}

const goToRecipe = (id) => {
  router.push(`/recipes/${id}`)
}

onMounted(() => {
  loadSuggestions()
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

.no-data-card {
  text-align: center;
  padding: 60px 24px;
}

.no-data-card h3 {
  margin: 0;
  color: #606266;
}

.user-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.user-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 14px;
}

.date-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.date-info .label {
  font-size: 12px;
  color: #909399;
}

.date-info .value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.date-info .days {
  font-size: 12px;
  color: #409EFF;
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 10px;
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

.nutrient-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.nutrient-card {
  border-left: 4px solid #e4e7ed;
}

.nutrient-card.normal {
  border-left-color: #67C23A;
}

.nutrient-card.deficit {
  border-left-color: #E6A23C;
}

.nutrient-card.excess {
  border-left-color: #F56C6C;
}

.nutrient-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.nutrient-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.nutrient-progress {
  margin-bottom: 12px;
}

.progress-bar {
  position: relative;
  height: 8px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: visible;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-fill.normal {
  background: linear-gradient(90deg, #67C23A, #85ce61);
}

.progress-fill.deficit {
  background: linear-gradient(90deg, #E6A23C, #f0c78a);
}

.progress-fill.excess {
  background: linear-gradient(90deg, #F56C6C, #f89898);
}

.target-line {
  position: absolute;
  top: -4px;
  width: 2px;
  height: 16px;
  background: #909399;
  transform: translateX(-50%);
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
}

.actual {
  color: #303133;
  font-weight: 500;
}

.target {
  color: #909399;
}

.nutrient-detail {
  font-size: 13px;
  padding-top: 12px;
  border-top: 1px solid #f2f6fc;
}

.deficit {
  color: #E6A23C;
}

.excess {
  color: #F56C6C;
}

.normal {
  color: #67C23A;
}

.suggestion-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 16px;
}

.suggestion-card {
  display: flex;
  gap: 16px;
  cursor: pointer;
}

.suggestion-card.warning {
  border-left: 4px solid #E6A23C;
}

.suggestion-card.danger {
  border-left: 4px solid #F56C6C;
}

.suggestion-icon {
  flex-shrink: 0;
  color: #fff;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.suggestion-card.warning .suggestion-icon {
  background: #E6A23C;
}

.suggestion-card.danger .suggestion-icon {
  background: #F56C6C;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.suggestion-desc {
  margin: 0 0 12px 0;
  color: #606266;
  line-height: 1.6;
}

.suggestion-numbers {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #909399;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.recipe-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.recipe-card:hover {
  transform: translateY(-4px);
}

.recipe-cover {
  width: 100%;
  height: 140px;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
  margin: -20px -20px 12px -20px;
}

.recipe-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.recipe-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.recipe-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.servings {
  font-size: 13px;
  color: #909399;
}

.recipe-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.recipe-stats .stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.nutrient-highlight {
  padding-top: 12px;
  border-top: 1px solid #f2f6fc;
  font-size: 13px;
  color: #606266;
}

.highlight-label {
  color: #909399;
}

.highlight-value {
  color: #409EFF;
  font-weight: 500;
  margin-left: 4px;
}

.refresh-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}

.refresh-time {
  font-size: 12px;
  color: #909399;
}
</style>
