<template>
  <div class="community-page">
    <div class="page-header">
      <h2 class="page-title">食谱社区</h2>
      <p class="page-desc">发现更多优质食谱，与美食爱好者一起分享</p>
    </div>

    <div class="card">
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索食谱名称或描述..."
          clearable
          style="width: 320px; margin-right: 16px;"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-radio-group v-model="currentCategory" @change="handleSearch" size="default">
          <el-radio-button
            v-for="cat in categories"
            :key="cat.value"
            :value="cat.value"
          >
            {{ cat.label }}
          </el-radio-button>
        </el-radio-group>

        <el-select
          v-model="currentSort"
          placeholder="排序方式"
          style="width: 140px; margin-left: auto;"
          @change="handleSearch"
        >
          <el-option
            v-for="opt in sortOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <div v-loading="loading" class="recipes-grid">
        <el-card
          v-for="recipe in recipes"
          :key="recipe.id"
          shadow="hover"
          class="recipe-card"
          @click="handleViewDetail(recipe)"
        >
          <div class="recipe-cover">
            <img v-if="recipe.cover_image" :src="recipe.cover_image" :alt="recipe.name" />
            <div v-else class="cover-placeholder">
              <el-icon :size="48"><Food /></el-icon>
            </div>
            <div class="hot-badge" v-if="currentSort === 'hot'">
              <el-icon><Star /></el-icon>
              热度 {{ recipe.hot_score || 0 }}
            </div>
          </div>

          <div class="recipe-content">
            <h3 class="recipe-name">{{ recipe.name }}</h3>
            <p class="recipe-desc" v-if="recipe.description">{{ recipe.description }}</p>

            <div class="recipe-meta">
              <el-tag :type="getCategoryTagType(recipe.category)" size="small">
                {{ recipe.category }}
              </el-tag>
              <span class="author">
                <el-icon><User /></el-icon>
                {{ recipe.author_nickname || '匿名用户' }}
              </span>
            </div>

            <div class="recipe-stats">
              <span class="stat-item">
                <el-icon color="#E6A23C"><Star fill="#E6A23C" /></el-icon>
                {{ recipe.avg_rating ? recipe.avg_rating.toFixed(1) : '0.0' }}
              </span>
              <span class="stat-item">
                <el-icon color="#F56C6C"><Star /></el-icon>
                收藏 {{ recipe.favorite_count || 0 }}
              </span>
              <span class="stat-item">
                <el-icon><User /></el-icon>
                {{ recipe.servings }} 人份
              </span>
            </div>
          </div>
        </el-card>
      </div>

      <div v-if="recipes.length === 0 && !loading" class="empty-state">
        <el-icon :size="48" style="margin-bottom: 16px;"><Document /></el-icon>
        <p>暂无公开食谱</p>
      </div>

      <div class="pagination" v-if="pagination.total_pages > 1">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </div>

    <el-dialog v-model="detailDialogVisible" title="食谱详情" width="900px" class="recipe-detail-dialog">
      <div v-if="currentRecipe" class="detail-content">
        <div class="detail-header">
          <div class="detail-cover">
            <img v-if="currentRecipe.cover_image" :src="currentRecipe.cover_image" :alt="currentRecipe.name" />
            <div v-else class="cover-placeholder-large">
              <el-icon :size="64"><Food /></el-icon>
            </div>
          </div>
          <div class="detail-info">
            <h2 class="detail-name">{{ currentRecipe.name }}</h2>
            <p class="detail-desc" v-if="currentRecipe.description">{{ currentRecipe.description }}</p>
            <div class="detail-meta">
              <el-tag :type="getCategoryTagType(currentRecipe.category)" size="small">
                {{ currentRecipe.category }}
              </el-tag>
              <span class="author-info">
                <el-avatar :size="24" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
                <span>{{ currentRecipe.author_nickname || '匿名用户' }}</span>
              </span>
            </div>
            <div class="detail-stats">
              <span class="stat-badge">
                <el-icon color="#E6A23C"><Star fill="#E6A23C" /></el-icon>
                {{ currentRecipe.avg_rating ? currentRecipe.avg_rating.toFixed(1) : '0.0' }} 分
                <span class="stat-count">({{ currentRecipe.total_ratings || 0 }}人评价)</span>
              </span>
              <span class="stat-badge">
                <el-icon color="#F56C6C"><Star /></el-icon>
                {{ currentRecipe.favorite_count || 0 }} 收藏
              </span>
              <span class="stat-badge">
                <el-icon><User /></el-icon>
                {{ currentRecipe.servings }} 人份
              </span>
            </div>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane label="烹饪步骤" name="steps">
            <div class="steps-section">
              <div v-for="(step, index) in currentRecipe.steps" :key="step.id" class="step-item">
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-content">
                  <p class="step-desc">{{ step.description }}</p>
                  <div v-if="step.ingredients && step.ingredients.length > 0" class="step-ingredients">
                    <span class="ingredients-label">食材：</span>
                    <el-tag
                      v-for="ing in step.ingredients"
                      :key="ing.id"
                      size="small"
                      type="info"
                      effect="light"
                      class="ingredient-tag"
                    >
                      {{ ing.name }} {{ ing.amount }}g
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="营养信息" name="nutrition">
            <div class="nutrition-section">
              <h4>每份营养</h4>
              <div class="nutrition-grid">
                <div class="nutrition-card">
                  <span class="nutrition-label">热量</span>
                  <span class="nutrition-value">{{ Math.round(currentRecipe.perServingNutrition?.calories || 0) }}</span>
                  <span class="nutrition-unit">kcal</span>
                </div>
                <div class="nutrition-card">
                  <span class="nutrition-label">蛋白质</span>
                  <span class="nutrition-value">{{ Math.round(currentRecipe.perServingNutrition?.protein || 0) }}</span>
                  <span class="nutrition-unit">g</span>
                </div>
                <div class="nutrition-card">
                  <span class="nutrition-label">脂肪</span>
                  <span class="nutrition-value">{{ Math.round(currentRecipe.perServingNutrition?.fat || 0) }}</span>
                  <span class="nutrition-unit">g</span>
                </div>
                <div class="nutrition-card">
                  <span class="nutrition-label">碳水</span>
                  <span class="nutrition-value">{{ Math.round(currentRecipe.perServingNutrition?.carbs || 0) }}</span>
                  <span class="nutrition-unit">g</span>
                </div>
                <div class="nutrition-card">
                  <span class="nutrition-label">膳食纤维</span>
                  <span class="nutrition-value">{{ Math.round(currentRecipe.perServingNutrition?.fiber || 0) }}</span>
                  <span class="nutrition-unit">g</span>
                </div>
                <div class="nutrition-card">
                  <span class="nutrition-label">钠</span>
                  <span class="nutrition-value">{{ Math.round(currentRecipe.perServingNutrition?.sodium || 0) }}</span>
                  <span class="nutrition-unit">mg</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleFavorite" :loading="importing">
          <el-icon><Star /></el-icon>
          {{ currentRecipe?.is_favorite ? '取消收藏' : '收藏' }}
        </el-button>
        <el-button type="success" @click="handleImport" :loading="importing">
          <el-icon><Download /></el-icon>
          导入到我的食谱库
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, User, Document, Star, Food, Download } from '@element-plus/icons-vue'
import { getCommunityRecipes, getCommunityRecipeDetail, importCommunityRecipe } from '@/api/community'
import { toggleFavorite } from '@/api/favorites'

const router = useRouter()

const categories = [
  { label: '全部', value: '' },
  { label: '早餐', value: '早餐' },
  { label: '午餐', value: '午餐' },
  { label: '晚餐', value: '晚餐' },
  { label: '小食', value: '小食' }
]

const sortOptions = [
  { label: '热度最高', value: 'hot' },
  { label: '最新发布', value: 'latest' },
  { label: '评分最高', value: 'rating' }
]

const searchKeyword = ref('')
const currentCategory = ref('')
const currentSort = ref('hot')
const loading = ref(false)
const recipes = ref([])
const pagination = ref({
  page: 1,
  page_size: 12,
  total: 0,
  total_pages: 0
})

const detailDialogVisible = ref(false)
const currentRecipe = ref(null)
const activeTab = ref('steps')
const importing = ref(false)

const getCategoryTagType = (category) => {
  const typeMap = {
    '早餐': 'primary',
    '午餐': 'success',
    '晚餐': 'warning',
    '小食': 'info'
  }
  return typeMap[category] || 'info'
}

const loadRecipes = async () => {
  loading.value = true
  try {
    const params = {
      sort_by: currentSort.value,
      page: pagination.value.page,
      page_size: pagination.value.page_size
    }
    if (currentCategory.value) {
      params.category = currentCategory.value
    }
    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }

    const res = await getCommunityRecipes(params)
    const data = res.data || res
    recipes.value = data.list || []
    pagination.value = {
      page: data.page || 1,
      page_size: data.page_size || 12,
      total: data.total || 0,
      total_pages: data.total_pages || 0
    }
  } catch (error) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadRecipes()
}

const handleViewDetail = async (recipe) => {
  try {
    const res = await getCommunityRecipeDetail(recipe.id)
    currentRecipe.value = res.data || res
    detailDialogVisible.value = true
    activeTab.value = 'steps'
  } catch (error) {
    ElMessage.error(error.message || '加载详情失败')
  }
}

const handleFavorite = async () => {
  if (!currentRecipe.value) return
  try {
    await toggleFavorite(currentRecipe.value.id)
    currentRecipe.value.is_favorite = !currentRecipe.value.is_favorite
    if (currentRecipe.value.is_favorite) {
      currentRecipe.value.favorite_count = (currentRecipe.value.favorite_count || 0) + 1
    } else {
      currentRecipe.value.favorite_count = Math.max(0, (currentRecipe.value.favorite_count || 0) - 1)
    }
    ElMessage.success(currentRecipe.value.is_favorite ? '收藏成功' : '已取消收藏')
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleImport = async () => {
  if (!currentRecipe.value) return
  importing.value = true
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入导入后的食谱名称（留空使用默认名称）',
      '导入食谱',
      {
        confirmButtonText: '确定导入',
        cancelButtonText: '取消',
        inputPlaceholder: `${currentRecipe.value.name} (导入)`,
        inputValue: `${currentRecipe.value.name} (导入)`
      }
    )

    const res = await importCommunityRecipe(currentRecipe.value.id, { new_name: newName })
    ElMessage.success('导入成功！已添加到您的食谱库')
    detailDialogVisible.value = false

    const importedRecipe = res.data?.recipe || res.data
    if (importedRecipe?.id) {
      router.push(`/recipes/${importedRecipe.id}`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '导入失败')
    }
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  loadRecipes()
})
</script>

<style scoped>
.page-desc {
  color: #909399;
  margin: 8px 0 0 0;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
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
  height: 180px;
  position: relative;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
  margin: -20px -20px 16px -20px;
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

.hot-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(230, 162, 60, 0.9);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.recipe-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recipe-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.recipe-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 36px;
}

.recipe-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.author {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.recipe-stats {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f2f6fc;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.detail-cover {
  width: 240px;
  height: 200px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
}

.detail-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder-large {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-name {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.detail-desc {
  color: #606266;
  margin: 0;
  line-height: 1.6;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.author-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.detail-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 20px;
  font-size: 13px;
  color: #606266;
}

.stat-count {
  color: #909399;
  font-size: 12px;
}

.detail-tabs {
  margin-top: 24px;
}

.steps-section {
  padding: 16px 0;
}

.step-item {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f2f6fc;
}

.step-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.step-number {
  width: 36px;
  height: 36px;
  background: #409EFF;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-desc {
  color: #303133;
  line-height: 1.8;
  margin: 0 0 12px 0;
}

.step-ingredients {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ingredients-label {
  color: #909399;
  font-size: 13px;
}

.ingredient-tag {
  margin: 2px 4px 2px 0;
}

.nutrition-section {
  padding: 16px 0;
}

.nutrition-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.nutrition-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nutrition-label {
  font-size: 13px;
  color: #909399;
}

.nutrition-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.nutrition-unit {
  font-size: 12px;
  color: #909399;
}

.recipe-detail-dialog :deep(.el-dialog__body) {
  padding: 20px;
}
</style>
