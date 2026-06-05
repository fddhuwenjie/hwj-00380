<template>
  <div class="data-management-page">
    <div class="page-header">
      <h2 class="page-title">数据管理</h2>
      <p class="page-desc">导入导出您的食谱、饮食日记和收藏数据</p>
    </div>

    <div class="content">
      <div class="card">
        <div class="section-title">
          <el-icon><Download /></el-icon>
          数据导出
        </div>
        <p class="section-desc">导出您所有的食谱、饮食日记、收藏和自定义食材数据为JSON文件格式</p>

        <div class="export-options">
          <el-checkbox v-model="exportOptions.recipes">食谱 ({{ recipeCount }})</el-checkbox>
          <el-checkbox v-model="exportOptions.diary">饮食日记 ({{ diaryCount }})</el-checkbox>
          <el-checkbox v-model="exportOptions.favorites">收藏 ({{ favoriteCount }})</el-checkbox>
          <el-checkbox v-model="exportOptions.custom_ingredients">自定义食材 ({{ ingredientCount }})</el-checkbox>
        </div>

        <div class="export-actions">
          <el-button type="primary" size="large" @click="handleExportAll" :loading="exporting">
            <el-icon><Download /></el-icon>
            导出全部数据
          </el-button>
          <el-button size="large" @click="handleExportAll" :loading="exporting">
            导出选中项
          </el-button>
        </div>
      </div>

      <div class="card">
        <div class="section-title">
          <el-icon><Upload /></el-icon>
          数据导入
        </div>
        <p class="section-desc">导入JSON格式的数据文件，支持导入他人分享的食谱或您的备份数据</p>

        <el-upload
          ref="uploadRef"
          class="upload-area"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept=".json"
          drag
        >
          <el-icon class="upload-icon"><Upload /></el-icon>
          <div class="upload-text">点击或拖拽JSON文件到此处</div>
          <div class="upload-hint">仅支持 .json 格式文件</div>
        </el-upload>

        <div v-if="importPreview" class="import-preview">
          <h4>数据预览</h4>
          <div class="preview-stats">
            <el-tag size="large" type="primary">
              食谱: {{ importPreview.recipes || 0 }} 个
            </el-tag>
            <el-tag size="large" type="success">
              日记: {{ importPreview.diary_entries || 0 }} 条
            </el-tag>
            <el-tag size="large" type="warning">
              收藏: {{ importPreview.favorites || 0 }} 个
            </el-tag>
            <el-tag size="large" type="info">
              自定义食材: {{ importPreview.custom_ingredients || 0 }} 个
            </el-tag>
          </div>
          <div class="preview-actions">
            <el-button @click="importPreview = null">取消</el-button>
            <el-button type="primary" @click="handleImport" :loading="importing">
              确认导入
            </el-button>
          </div>
        </div>

        <div v-if="importResult" class="import-result" :class="importResult.success ? 'success' : 'error'">
          <el-icon v-if="importResult.success"><Check /></el-icon>
          <el-icon v-else><Close /></el-icon>
          <div class="result-content">
            <h4>{{ importResult.success ? '导入成功！' : '导入失败' }}</h4>
            <p v-if="importResult.message">{{ importResult.message }}</p>
            <div v-if="importResult.details" class="result-details">
              <div>食谱: 成功 {{ importResult.details.recipes?.success || 0 }} 个，失败 {{ importResult.details.recipes?.failed || 0 }} 个</div>
              <div>日记: 成功 {{ importResult.details.diary?.success || 0 }} 条，失败 {{ importResult.details.diary?.failed || 0 }} 条</div>
              <div v-if="importResult.details.warnings && importResult.details.warnings.length > 0" class="warnings">
                <div class="warnings-title">提示:</div>
                <div v-for="(warn, idx) in importResult.details.warnings" :key="idx" class="warning-item">
                  {{ warn }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-title">
          <el-icon><InfoFilled /></el-icon>
          使用说明
        </div>
        <div class="instructions">
          <div class="instruction-item">
            <div class="instruction-icon">1</div>
            <div class="instruction-content">
              <h4>导出数据</h4>
              <p>点击导出按钮下载您的所有数据，建议定期备份以防数据丢失。导出文件包含食谱、饮食日记、收藏等所有个人数据。</p>
            </div>
          </div>
          <div class="instruction-item">
            <div class="instruction-icon">2</div>
            <div class="instruction-content">
              <h4>导入数据</h4>
              <p>选择JSON文件进行导入，系统会自动校验数据格式并处理食材ID映射。导入的食谱将添加到您的食谱库中。</p>
            </div>
          </div>
          <div class="instruction-item">
            <div class="instruction-icon">3</div>
            <div class="instruction-content">
              <h4>分享食谱</h4>
              <p>在食谱详情页点击「导出食谱」可导出单个食谱，分享给其他用户导入使用。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download, Upload, Check, InfoFilled, Close
} from '@element-plus/icons-vue'
import { exportAllData, validateImportData, importAllData } from '@/api/importExport'
import { getRecipes } from '@/api/recipes'
import { getDiaryHistory } from '@/api/diary'
import { getFavorites } from '@/api/favorites'
import { getIngredients } from '@/api/ingredients'

const uploadRef = ref(null)
const exporting = ref(false)
const importing = ref(false)
const importPreview = ref(null)
const importResult = ref(null)
const pendingImportData = ref(null)

const recipeCount = ref(0)
const diaryCount = ref(0)
const favoriteCount = ref(0)
const ingredientCount = ref(0)

const exportOptions = reactive({
  recipes: true,
  diary: true,
  favorites: true,
  custom_ingredients: true
})

const loadStats = async () => {
  try {
    const [recipesRes, diaryRes, favoritesRes, ingredientsRes] = await Promise.all([
      getRecipes({ page_size: 1 }),
      getDiaryHistory({ page_size: 1 }),
      getFavorites(),
      getIngredients({ page_size: 1, custom_only: true })
    ])
    recipeCount.value = recipesRes.data?.total || recipesRes.total || 0
    diaryCount.value = diaryRes.data?.total || diaryRes.total || 0
    favoriteCount.value = Array.isArray(favoritesRes.data) ? favoritesRes.data.length : (Array.isArray(favoritesRes) ? favoritesRes.length : 0)
    ingredientCount.value = ingredientsRes.data?.total || ingredientsRes.total || 0
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

const handleExportAll = async () => {
  exporting.value = true
  try {
    const res = await exportAllData()
    const blob = res.data || res
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    const date = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `营养管理系统_数据备份_${date}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error(error.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

const handleFileChange = async (file) => {
  if (!file) return
  
  const fileName = file.name || ''
  if (!fileName.toLowerCase().endsWith('.json')) {
    ElMessage.error('请上传JSON格式文件')
    return
  }

  try {
    const text = await file.raw.text()
    const data = JSON.parse(text)
    
    const validateRes = await validateImportData(data)
    const validateResult = validateRes.data || validateRes
    
    if (!validateResult.valid) {
      ElMessage.error(validateResult.message || '数据格式校验失败')
      return
    }

    importPreview.value = validateResult.preview || {}
    pendingImportData.value = data
    importResult.value = null
  } catch (error) {
    if (error instanceof SyntaxError) {
      ElMessage.error('JSON格式错误，请检查文件内容')
    } else {
      ElMessage.error(error.message || '文件解析失败')
    }
  }
}

const handleImport = async () => {
  if (!pendingImportData.value) return

  try {
    await ElMessageBox.confirm(
      '确认导入这些数据吗？导入的数据将添加到您的账户中。',
      '导入确认',
      {
        confirmButtonText: '确认导入',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    importing.value = true
    const res = await importAllData(pendingImportData.value)
    const result = res.data || res

    importResult.value = {
      success: true,
      message: '数据导入成功',
      details: result
    }

    importPreview.value = null
    pendingImportData.value = null
    loadStats()

    ElMessage.success('导入完成')
  } catch (error) {
    if (error === 'cancel') return
    importResult.value = {
      success: false,
      message: error.message || '导入失败'
    }
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  loadStats()
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

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.section-desc {
  color: #606266;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.export-options {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.export-options :deep(.el-checkbox) {
  font-size: 14px;
}

.export-actions {
  display: flex;
  gap: 12px;
}

.upload-area {
  margin-bottom: 24px;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 40px 20px;
  background: #f5f7fa;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #409EFF;
  background: #ecf5ff;
}

.upload-icon {
  font-size: 48px;
  color: #409EFF;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: #909399;
}

.import-preview {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.import-preview h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.preview-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.import-result {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.import-result.success {
  background: #f0f9eb;
  border: 1px solid #67C23A;
}

.import-result.error {
  background: #fef0f0;
  border: 1px solid #F56C6C;
}

.import-result :deep(.el-icon) {
  font-size: 32px;
  flex-shrink: 0;
}

.import-result.success :deep(.el-icon) {
  color: #67C23A;
}

.import-result.error :deep(.el-icon) {
  color: #F56C6C;
}

.result-content h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.result-content p {
  margin: 0 0 12px 0;
  color: #606266;
}

.result-details {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

.warnings {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.warnings-title {
  font-weight: 500;
  color: #E6A23C;
  margin-bottom: 4px;
}

.warning-item {
  color: #E6A23C;
  padding-left: 12px;
  position: relative;
}

.warning-item::before {
  content: '•';
  position: absolute;
  left: 0;
}

.instructions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.instruction-item {
  display: flex;
  gap: 16px;
}

.instruction-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
}

.instruction-content h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.instruction-content p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}
</style>
