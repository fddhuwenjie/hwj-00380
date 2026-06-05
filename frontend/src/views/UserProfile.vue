<template>
  <div class="user-profile-page">
    <div class="page-header">
      <h2 class="page-title">体质档案</h2>
    </div>

    <div v-loading="userStore.loading" class="content-wrapper">
      <div class="card profile-card">
        <h3 class="section-title">基本信息</h3>
        <el-form :model="profileForm" label-width="120px" class="profile-form">
          <el-form-item label="昵称">
            <el-input v-model="profileForm.username" placeholder="请输入昵称" style="width: 300px;" />
          </el-form-item>

          <el-form-item label="性别">
            <el-radio-group v-model="profileForm.gender">
              <el-radio value="male">男</el-radio>
              <el-radio value="female">女</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="年龄">
            <el-input-number
              v-model="profileForm.age"
              :min="1"
              :max="120"
              :step="1"
            />
            <span class="form-unit">岁</span>
          </el-form-item>

          <el-form-item label="身高">
            <el-input-number
              v-model="profileForm.height"
              :min="100"
              :max="250"
              :step="1"
              :precision="0"
            />
            <span class="form-unit">cm</span>
          </el-form-item>

          <el-form-item label="体重">
            <el-input-number
              v-model="profileForm.weight"
              :min="30"
              :max="200"
              :step="0.1"
              :precision="1"
            />
            <span class="form-unit">kg</span>
          </el-form-item>

          <el-form-item label="运动量">
            <el-select v-model="profileForm.activity_level" style="width: 300px;">
              <el-option
                v-for="level in activityLevels"
                :key="level.key"
                :label="level.label + ' - ' + level.description"
                :value="level.key"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleCalculate">
              <el-icon><Refresh /></el-icon>
              重新计算
            </el-button>
            <el-button type="success" @click="handleSave">
              <el-icon><Check /></el-icon>
              保存档案
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="card results-card">
        <h3 class="section-title">代谢计算结果</h3>
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-icon bmr-icon">
              <el-icon :size="28"><Star /></el-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">基础代谢率 (BMR)</span>
              <span class="metric-value">{{ calculatedResults.bmr }}</span>
              <span class="metric-unit">kcal/天</span>
              <span class="metric-desc">维持生命所需最低热量</span>
            </div>
          </div>

          <div class="metric-item">
            <div class="metric-icon tdee-icon">
              <el-icon :size="28"><Setting /></el-icon>
            </div>
            <div class="metric-content">
              <span class="metric-label">每日总消耗 (TDEE)</span>
              <span class="metric-value highlight">{{ calculatedResults.tdee }}</span>
              <span class="metric-unit">kcal/天</span>
              <span class="metric-desc">含运动的每日总热量消耗</span>
            </div>
          </div>

          <div class="metric-item">
            <div class="metric-info">
              <span class="info-label">活动系数</span>
              <span class="info-value">{{ calculatedResults.activity_multiplier }}</span>
            </div>
          </div>
        </div>

        <div class="formula-note">
          <el-alert
            title="计算公式"
            :type="'info'"
            :closable="false"
            show-icon
          >
            <p>BMR(男) = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 + 5</p>
            <p>BMR(女) = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄 - 161</p>
            <p>TDEE = BMR × 活动系数</p>
          </el-alert>
        </div>
      </div>

      <div class="card targets-card">
        <h3 class="section-title">每日营养目标 (基于TDEE)</h3>
        <div class="targets-grid">
          <div class="target-item">
            <div class="target-header">
              <span class="target-name">热量</span>
              <span class="target-value">{{ nutrientTargets.calories }} kcal</span>
            </div>
            <el-progress
              :percentage="100"
              :color="'#409EFF'"
              :stroke-width="8"
              :show-text="false"
            />
            <span class="target-ratio">100%</span>
          </div>

          <div class="target-item">
            <div class="target-header">
              <span class="target-name">蛋白质</span>
              <span class="target-value">{{ nutrientTargets.protein }} g</span>
            </div>
            <el-progress
              :percentage="40"
              :color="'#67C23A'"
              :stroke-width="8"
              :show-text="false"
            />
            <span class="target-ratio">40% ({{ nutrientTargets.protein * 4 }} kcal)</span>
          </div>

          <div class="target-item">
            <div class="target-header">
              <span class="target-name">脂肪</span>
              <span class="target-value">{{ nutrientTargets.fat }} g</span>
            </div>
            <el-progress
              :percentage="30"
              :color="'#E6A23C'"
              :stroke-width="8"
              :show-text="false"
            />
            <span class="target-ratio">30% ({{ nutrientTargets.fat * 9 }} kcal)</span>
          </div>

          <div class="target-item">
            <div class="target-header">
              <span class="target-name">碳水化合物</span>
              <span class="target-value">{{ nutrientTargets.carbs }} g</span>
            </div>
            <el-progress
              :percentage="30"
              :color="'#F56C6C'"
              :stroke-width="8"
              :show-text="false"
            />
            <span class="target-ratio">30% ({{ nutrientTargets.carbs * 4 }} kcal)</span>
          </div>

          <div class="target-item">
            <div class="target-header">
              <span class="target-name">膳食纤维</span>
              <span class="target-value">{{ nutrientTargets.fiber }} g</span>
            </div>
          </div>

          <div class="target-item">
            <div class="target-header">
              <span class="target-name">钠</span>
              <span class="target-value">{{ nutrientTargets.sodium }} mg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store'
import { ElMessage } from 'element-plus'
import { Refresh, Check, Star, Setting } from '@element-plus/icons-vue'

const userStore = useUserStore()

const profileForm = reactive({
  username: '',
  gender: 'male',
  age: 30,
  height: 175,
  weight: 70,
  activity_level: 'moderate'
})

const activityLevels = ref([])
const calculatedResults = reactive({
  bmr: 0,
  tdee: 0,
  activity_multiplier: 1.2
})

const nutrientTargets = reactive({
  calories: 2000,
  protein: 60,
  fat: 65,
  carbs: 300,
  carbohydrate: 300,
  fiber: 25,
  sodium: 2000
})

const handleCalculate = async () => {
  try {
    const res = await userStore.calculate({
      weight: profileForm.weight,
      height: profileForm.height,
      age: profileForm.age,
      gender: profileForm.gender,
      activity_level: profileForm.activity_level
    })
    const data = res.data || res
    if (data) {
      calculatedResults.bmr = data.bmr
      calculatedResults.tdee = data.tdee
      calculatedResults.activity_multiplier = data.activity_multiplier
      if (data.nutrientTargets) {
        Object.assign(nutrientTargets, data.nutrientTargets)
      }
    }
    ElMessage.success('计算完成')
  } catch (err) {
    ElMessage.error(err.message || '计算失败')
  }
}

const handleSave = async () => {
  try {
    const res = await userStore.updateProfile({
      username: profileForm.username,
      height: profileForm.height,
      weight: profileForm.weight,
      age: profileForm.age,
      gender: profileForm.gender,
      activity_level: profileForm.activity_level
    })
    const data = res.data || res
    if (data) {
      calculatedResults.bmr = data.bmr
      calculatedResults.tdee = data.tdee
      if (data.nutrientTargets) {
        Object.assign(nutrientTargets, data.nutrientTargets)
      }
    }
    ElMessage.success('档案保存成功')
  } catch (err) {
    ElMessage.error(err.message || '保存失败')
  }
}

const loadData = async () => {
  try {
    await userStore.fetchActivityLevels()
    activityLevels.value = userStore.activityLevels

    const profile = await userStore.fetchProfile()
    if (profile) {
      profileForm.username = profile.username || ''
      profileForm.gender = profile.gender || 'male'
      profileForm.age = profile.age || 30
      profileForm.height = profile.height || 175
      profileForm.weight = profile.weight || 70
      profileForm.activity_level = profile.activity_level || 'moderate'
      calculatedResults.bmr = profile.bmr || 0
      calculatedResults.tdee = profile.tdee || 0
      if (profile.nutrientTargets) {
        Object.assign(nutrientTargets, profile.nutrientTargets)
      }
    }

    if (calculatedResults.bmr === 0) {
      await handleCalculate()
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
.user-profile-page {
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

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
}

.profile-form {
  max-width: 600px;
}

.form-unit {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.metric-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.bmr-icon {
  background: linear-gradient(135deg, #ff6b6b, #feca57);
}

.tdee-icon {
  background: linear-gradient(135deg, #409EFF, #67C23A);
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.metric-value.highlight {
  color: #409EFF;
}

.metric-unit {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.metric-desc {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
}

.metric-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.info-label {
  font-size: 13px;
  color: #606266;
}

.info-value {
  font-size: 24px;
  font-weight: 700;
  color: #909399;
}

.formula-note {
  margin-top: 20px;
}

.formula-note :deep(p) {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
  font-family: 'Consolas', 'Monaco', monospace;
}

.targets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.target-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.target-name {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.target-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.target-ratio {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: block;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .targets-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .targets-grid {
    grid-template-columns: 1fr;
  }

  .profile-form {
    max-width: 100%;
  }
}
</style>
