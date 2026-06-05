<template>
  <div class="recipe-form-page">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑食谱' : '创建食谱' }}</h2>
      <div class="header-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </div>
    </div>

    <div class="card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        v-loading="loading"
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="食谱名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入食谱名称"
                size="large"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="分类" prop="category">
              <el-select
                v-model="formData.category"
                placeholder="请选择分类"
                size="large"
                style="width: 100%;"
              >
                <el-option label="早餐" value="早餐" />
                <el-option label="午餐" value="午餐" />
                <el-option label="晚餐" value="晚餐" />
                <el-option label="小食" value="小食" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="份数" prop="servings">
              <el-input-number
                v-model="formData.servings"
                :min="1"
                :max="20"
                size="large"
                style="width: 100%;"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title">
          <h3>制作步骤</h3>
          <el-button type="primary" size="small" @click="addStep">
            <el-icon><Plus /></el-icon>
            添加步骤
          </el-button>
        </div>

        <div class="steps-container">
          <div
            v-for="(step, index) in formData.steps"
            :key="index"
            class="step-card"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">
              <div class="step-header">
                <el-form-item
                  :prop="`steps.${index}.description`"
                  :rules="{ required: true, message: '请输入步骤描述', trigger: 'blur' }"
                  style="flex: 1; margin-bottom: 0;"
                >
                  <el-input
                    v-model="step.description"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入步骤描述"
                  />
                </el-form-item>
                <el-button
                  type="danger"
                  link
                  class="delete-step-btn"
                  :disabled="formData.steps.length <= 1"
                  @click="removeStep(index)"
                >
                  <el-icon><Delete /></el-icon>
                  删除步骤
                </el-button>
              </div>

              <div class="ingredients-section">
                <div class="ingredients-header">
                  <span style="font-weight: 500; color: #606266;">食材清单</span>
                  <el-button
                    type="primary"
                    size="small"
                    link
                    @click="addIngredient(index)"
                  >
                    <el-icon><Plus /></el-icon>
                    添加食材
                  </el-button>
                </div>

                <div
                  v-for="(ing, ingIndex) in step.ingredients"
                  :key="ingIndex"
                  class="ingredient-row"
                >
                  <el-select
                    v-model="ing.ingredient_id"
                    filterable
                    remote
                    placeholder="搜索食材..."
                    style="flex: 1; margin-right: 12px;"
                    :remote-method="(keyword) => searchIngredients(keyword, index, ingIndex)"
                    :loading="ingredientLoading[index]?.[ingIndex] || false"
                    @change="(val) => handleIngredientChange(index, ingIndex, val)"
                  >
                    <el-option
                      v-for="item in filteredIngredients[index]?.[ingIndex] || []"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    >
                      <span>{{ item.name }}</span>
                      <span style="float: right; color: #8492a6; font-size: 12px;">
                        {{ item.category }} · {{ item.calories }}kcal
                      </span>
                    </el-option>
                  </el-select>
                  <el-input-number
                    v-model="ing.amount"
                    :min="1"
                    :max="10000"
                    placeholder="用量"
                    style="width: 140px; margin-right: 8px;"
                    controls-position="right"
                  />
                  <span style="width: 30px; color: #606266;">g</span>
                  <el-button
                    type="danger"
                    link
                    class="delete-ingredient-btn"
                    @click="removeIngredient(index, ingIndex)"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>

                <div v-if="step.ingredients.length === 0" class="empty-ingredients">
                  暂无食材，点击上方按钮添加
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <div class="nutrition-panel">
      <div class="nutrition-header">
        <h3>营养计算</h3>
        <el-tag :type="formData.servings > 0 ? 'success' : 'info'">
          {{ formData.servings }} 人份
        </el-tag>
      </div>

      <el-row :gutter="24">
        <el-col :span="12">
          <div class="nutrition-section">
            <h4>总营养</h4>
            <div class="nutrition-grid">
              <div class="nutrition-item">
                <span class="label">热量</span>
                <span class="value">{{ totalNutrition.calories }}<span class="unit">kcal</span></span>
              </div>
              <div class="nutrition-item">
                <span class="label">蛋白</span>
                <span class="value">{{ totalNutrition.protein }}<span class="unit">g</span></span>
              </div>
              <div class="nutrition-item">
                <span class="label">脂肪</span>
                <span class="value">{{ totalNutrition.fat }}<span class="unit">g</span></span>
              </div>
              <div class="nutrition-item">
                <span class="label">碳水</span>
                <span class="value">{{ totalNutrition.carbs }}<span class="unit">g</span></span>
              </div>
              <div class="nutrition-item">
                <span class="label">纤维</span>
                <span class="value">{{ totalNutrition.fiber }}<span class="unit">g</span></span>
              </div>
              <div class="nutrition-item">
                <span class="label">钠</span>
                <span class="value">{{ totalNutrition.sodium }}<span class="unit">mg</span></span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="nutrition-section">
            <h4>每份营养</h4>
            <div class="nutrition-grid">
              <div class="nutrition-item">
                <span class="label">热量</span>
                <span class="value">{{ perServingNutrition.calories }}<span class="unit">kcal</span></span>
              </div>
              <div class="nutrition-item">
                <span class="label">蛋白</span>
                <span class="value">{{ perServingNutrition.protein }}<span class="unit">g</span></span>
              </div>
              <div class="nutrition-item">
                <span class="label">脂肪</span>
                <span class="value">{{ perServingNutrition.fat }}<span class="unit">g</span></span>
              </div>
              <div class="nutrition-item">
                <span class="label">碳水</span>
                <span class="value">{{ perServingNutrition.carbs }}<span class="unit">g</span></span>
              </div>
              <div class="nutrition-item">
                <span class="label">纤维</span>
                <span class="value">{{ perServingNutrition.fiber }}<span class="unit">g</span></span>
              </div>
              <div class="nutrition-item">
                <span class="label">钠</span>
                <span class="value">{{ perServingNutrition.sodium }}<span class="unit">mg</span></span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <div v-if="nutritionWarnings.length > 0" class="warnings-section">
        <h4>营养预警</h4>
        <div class="warnings-list">
          <span
            v-for="warning in nutritionWarnings"
            :key="warning.type"
            :class="['warning-tag', getWarningClass(warning.type)]"
          >
            {{ warning.message }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Close } from '@element-plus/icons-vue'
import { useRecipesStore, useIngredientsStore } from '@/store'
import { searchIngredients as searchIngredientsApi } from '@/api/ingredients'
import { calculateTotalNutrition, roundNutrition, checkNutritionWarnings } from '@/utils/nutrition'

const route = useRoute()
const router = useRouter()
const recipes = useRecipesStore()
const ingredientsStore = useIngredientsStore()

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const ingredientLoading = reactive({})
const filteredIngredients = reactive({})
const searchCache = ref({})

const isEdit = computed(() => !!route.params.id)
const editId = computed(() => route.params.id)

const formData = reactive({
  name: '',
  category: '',
  servings: 1,
  steps: [
    {
      step_order: 1,
      description: '',
      ingredients: []
    }
  ]
})

const formRules = {
  name: [{ required: true, message: '请输入食谱名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  servings: [{ required: true, message: '请输入份数', trigger: 'blur' }]
}

const allIngredients = computed(() => ingredientsStore.list || [])

const allIngredientsItems = computed(() => {
  const items = []
  formData.steps.forEach(step => {
    step.ingredients.forEach(ing => {
      if (ing.ingredient_id && ing.amount) {
        const ingredient = allIngredients.value.find(i => i.id === ing.ingredient_id)
        if (ingredient) {
          items.push({
            amount: ing.amount,
            nutrition: {
              calories: ingredient.calories,
              protein: ingredient.protein,
              fat: ingredient.fat,
              carbohydrate: ingredient.carbs,
              fiber: ingredient.fiber,
              sodium: ingredient.sodium
            }
          })
        }
      }
    })
  })
  return items
})

const totalNutrition = computed(() => {
  const nutrition = calculateTotalNutrition(allIngredientsItems.value)
  const rounded = roundNutrition({
    calories: nutrition.calories,
    protein: nutrition.protein,
    fat: nutrition.fat,
    carbs: nutrition.carbohydrate,
    fiber: nutrition.fiber,
    sodium: nutrition.sodium
  }, 1)
  return rounded
})

const perServingNutrition = computed(() => {
  const servings = formData.servings || 1
  const nutrition = totalNutrition.value
  return roundNutrition({
    calories: nutrition.calories / servings,
    protein: nutrition.protein / servings,
    fat: nutrition.fat / servings,
    carbs: nutrition.carbs / servings,
    fiber: nutrition.fiber / servings,
    sodium: nutrition.sodium / servings
  }, 1)
})

const nutritionWarnings = computed(() => {
  return checkNutritionWarnings(perServingNutrition.value)
})

const getWarningClass = (type) => {
  const classMap = {
    sodium: 'high-sodium',
    fat: 'high-fat',
    sugar: 'high-sugar'
  }
  return classMap[type] || ''
}

const searchIngredients = async (keyword, stepIndex, ingIndex) => {
  if (!keyword) {
    filteredIngredients[stepIndex] = filteredIngredients[stepIndex] || {}
    filteredIngredients[stepIndex][ingIndex] = allIngredients.value.slice(0, 50)
    return
  }

  if (searchCache.value[keyword]) {
    filteredIngredients[stepIndex] = filteredIngredients[stepIndex] || {}
    filteredIngredients[stepIndex][ingIndex] = searchCache.value[keyword]
    return
  }

  ingredientLoading[stepIndex] = ingredientLoading[stepIndex] || {}
  ingredientLoading[stepIndex][ingIndex] = true

  try {
    const res = await searchIngredientsApi(keyword)
    const data = res.data || res
    searchCache.value[keyword] = data
    filteredIngredients[stepIndex] = filteredIngredients[stepIndex] || {}
    filteredIngredients[stepIndex][ingIndex] = data
  } catch (error) {
    console.error('搜索食材失败', error)
  } finally {
    ingredientLoading[stepIndex][ingIndex] = false
  }
}

const handleIngredientChange = (stepIndex, ingIndex, ingredientId) => {
  const ingredient = allIngredients.value.find(i => i.id === ingredientId)
  if (ingredient) {
    formData.steps[stepIndex].ingredients[ingIndex].ingredient_name = ingredient.name
  }
}

const addStep = () => {
  const newIndex = formData.steps.length + 1
  formData.steps.push({
    step_order: newIndex,
    description: '',
    ingredients: []
  })
  updateStepOrders()
}

const removeStep = (index) => {
  if (formData.steps.length <= 1) return
  formData.steps.splice(index, 1)
  updateStepOrders()
}

const updateStepOrders = () => {
  formData.steps.forEach((step, index) => {
    step.step_order = index + 1
  })
}

const addIngredient = (stepIndex) => {
  if (!filteredIngredients[stepIndex]) {
    filteredIngredients[stepIndex] = {}
  }
  const ingIndex = formData.steps[stepIndex].ingredients.length
  filteredIngredients[stepIndex][ingIndex] = allIngredients.value.slice(0, 50)

  formData.steps[stepIndex].ingredients.push({
    ingredient_id: null,
    ingredient_name: '',
    amount: 100
  })
}

const removeIngredient = (stepIndex, ingIndex) => {
  formData.steps[stepIndex].ingredients.splice(ingIndex, 1)
}

const loadEditData = async () => {
  if (!isEdit.value) return

  loading.value = true
  try {
    const recipe = await recipes.fetchById(editId.value)
    if (recipe) {
      formData.name = recipe.name
      formData.category = recipe.category
      formData.servings = recipe.servings
      formData.steps = recipe.steps.map((step, index) => ({
        step_order: index + 1,
        description: step.description,
        ingredients: step.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          ingredient_name: ing.name,
          amount: ing.amount
        }))
      }))

      formData.steps.forEach((step, stepIndex) => {
        filteredIngredients[stepIndex] = filteredIngredients[stepIndex] || {}
        step.ingredients.forEach((ing, ingIndex) => {
          filteredIngredients[stepIndex][ingIndex] = allIngredients.value.slice(0, 50)
        })
      })
    }
  } catch (error) {
    ElMessage.error('加载食谱数据失败')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (formData.steps.length === 0) {
      ElMessage.warning('请至少添加一个步骤')
      return
    }

    const hasEmptyStep = formData.steps.some(s => !s.description.trim())
    if (hasEmptyStep) {
      ElMessage.warning('请填写所有步骤的描述')
      return
    }

    saving.value = true

    const submitData = {
      name: formData.name,
      category: formData.category,
      servings: formData.servings,
      steps: formData.steps.map((step, index) => ({
        step_order: index + 1,
        description: step.description,
        ingredients: step.ingredients
          .filter(ing => ing.ingredient_id && ing.amount > 0)
          .map(ing => ({
            ingredient_id: ing.ingredient_id,
            ingredient_name: ing.ingredient_name,
            amount: ing.amount
          }))
      }))
    }

    if (isEdit.value) {
      await recipes.update(editId.value, submitData)
      ElMessage.success('更新成功')
    } else {
      await recipes.create(submitData)
      ElMessage.success('创建成功')
    }

    router.push('/recipes')
  } catch (error) {
    if (error !== false) {
      ElMessage.error(error.message || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  router.push('/recipes')
}

onMounted(async () => {
  await ingredientsStore.fetchList()
  await loadEditData()

  if (!isEdit.value) {
    filteredIngredients[0] = filteredIngredients[0] || {}
    filteredIngredients[0][0] = allIngredients.value.slice(0, 50)
  }
})
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 12px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 24px 0 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f2f6fc;
}

.section-title h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.step-number {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.delete-step-btn {
  flex-shrink: 0;
  margin-top: 8px;
}

.ingredients-section {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.ingredients-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f2f6fc;
}

.ingredient-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.ingredient-row:last-child {
  margin-bottom: 0;
}

.delete-ingredient-btn {
  flex-shrink: 0;
}

.empty-ingredients {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}

.nutrition-panel {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.nutrition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f2f6fc;
}

.nutrition-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.nutrition-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin: 0 0 16px 0;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.nutrition-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.nutrition-item .label {
  font-size: 12px;
  color: #909399;
}

.nutrition-item .value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.nutrition-item .value .unit {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
  margin-left: 2px;
}

.warnings-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.warnings-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin: 0 0 12px 0;
}

.warnings-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
