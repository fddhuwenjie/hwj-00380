<template>
  <div class="ingredients-page">
    <div class="page-header">
      <h2 class="page-title">食材库</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加自定义食材
      </el-button>
    </div>

    <div class="card">
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索食材名称..."
          clearable
          style="width: 280px; margin-right: 16px;"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div class="category-tags">
          <el-tag
            v-for="cat in categories"
            :key="cat.value"
            :type="currentCategory === cat.value ? 'primary' : 'info'"
            :effect="currentCategory === cat.value ? 'dark' : 'plain'"
            class="category-tag"
            @click="handleCategoryChange(cat.value)"
          >
            {{ cat.label }}
          </el-tag>
        </div>
      </div>

      <el-table
        :data="paginatedData"
        v-loading="ingredients.loading"
        style="margin-top: 20px;"
      >
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getCategoryTagType(row.category)">
              {{ row.category }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="calories" label="热量(kcal)" width="110" align="right">
          <template #default="{ row }">
            {{ row.calories || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="protein" label="蛋白(g)" width="100" align="right">
          <template #default="{ row }">
            {{ row.protein || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="fat" label="脂肪(g)" width="100" align="right">
          <template #default="{ row }">
            {{ row.fat || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="carbs" label="碳水(g)" width="100" align="right">
          <template #default="{ row }">
            {{ row.carbs || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="fiber" label="纤维(g)" width="100" align="right">
          <template #default="{ row }">
            {{ row.fiber || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="sodium" label="钠(mg)" width="100" align="right">
          <template #default="{ row }">
            {{ row.sodium || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-actions" style="justify-content: center;">
              <el-button
                size="small"
                type="primary"
                link
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                link
                :disabled="!row.is_custom"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingIngredient ? '编辑食材' : '添加自定义食材'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入食材名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%;">
            <el-option
              v-for="cat in categories.filter(c => c.value !== '')"
              :key="cat.value"
              :label="cat.label"
              :value="cat.value"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="热量" prop="calories">
              <el-input-number
                v-model="formData.calories"
                :min="0"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <span style="color: #909399; font-size: 12px;">kcal/100g</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="蛋白" prop="protein">
              <el-input-number
                v-model="formData.protein"
                :min="0"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <span style="color: #909399; font-size: 12px;">g/100g</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="脂肪" prop="fat">
              <el-input-number
                v-model="formData.fat"
                :min="0"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <span style="color: #909399; font-size: 12px;">g/100g</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="碳水" prop="carbs">
              <el-input-number
                v-model="formData.carbs"
                :min="0"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <span style="color: #909399; font-size: 12px;">g/100g</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="纤维" prop="fiber">
              <el-input-number
                v-model="formData.fiber"
                :min="0"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <span style="color: #909399; font-size: 12px;">g/100g</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="钠" prop="sodium">
              <el-input-number
                v-model="formData.sodium"
                :min="0"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <span style="color: #909399; font-size: 12px;">mg/100g</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="deleteDialogVisible" title="确认删除" width="400px">
      <p>确定要删除食材「{{ deletingIngredient?.name }}」吗？</p>
      <p style="color: #909399; font-size: 12px; margin-top: 8px;">此操作不可恢复，请谨慎操作。</p>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useIngredientsStore } from '@/store'
import { searchIngredients } from '@/api/ingredients'

const router = useRouter()
const ingredients = useIngredientsStore()

const categories = [
  { label: '全部', value: '' },
  { label: '肉类', value: '肉类' },
  { label: '蔬菜', value: '蔬菜' },
  { label: '水果', value: '水果' },
  { label: '谷物', value: '谷物' },
  { label: '调料', value: '调料' },
  { label: '蛋奶', value: '蛋奶' },
  { label: '水产', value: '水产' },
  { label: '坚果', value: '坚果' },
  { label: '豆类', value: '豆类' },
  { label: '其他', value: '其他' }
]

const searchKeyword = ref('')
const currentCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const formRef = ref(null)
const editingIngredient = ref(null)
const deletingIngredient = ref(null)

const formData = ref({
  name: '',
  category: '',
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
  sodium: 0
})

const formRules = {
  name: [{ required: true, message: '请输入食材名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const filteredData = computed(() => {
  let result = [...ingredients.list]

  if (currentCategory.value) {
    result = result.filter(item => item.category === currentCategory.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(keyword)
    )
  }

  return result
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const getCategoryTagType = (category) => {
  const typeMap = {
    '肉类': 'danger',
    '蔬菜': 'success',
    '水果': 'warning',
    '谷物': 'primary',
    '调料': 'info',
    '蛋奶': '',
    '水产': 'warning',
    '坚果': 'success',
    '豆类': 'primary',
    '其他': 'info'
  }
  return typeMap[category] || 'info'
}

const loadData = async () => {
  await ingredients.fetchList()
}

const handleSearch = async () => {
  currentPage.value = 1
}

const handleCategoryChange = (category) => {
  currentCategory.value = category
  currentPage.value = 1
}

const handleSizeChange = () => {
  currentPage.value = 1
}

const handleCurrentChange = () => {}

const handleAdd = () => {
  editingIngredient.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  editingIngredient.value = row
  formData.value = {
    name: row.name,
    category: row.category,
    calories: row.calories || 0,
    protein: row.protein || 0,
    fat: row.fat || 0,
    carbs: row.carbs || 0,
    fiber: row.fiber || 0,
    sodium: row.sodium || 0
  }
  dialogVisible.value = true
}

const handleDelete = (row) => {
  if (!row.is_custom) {
    ElMessage.warning('只能删除自定义食材')
    return
  }
  deletingIngredient.value = row
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  try {
    await ingredients.remove(deletingIngredient.value.id)
    ElMessage.success('删除成功')
    deleteDialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  }
}

const resetForm = () => {
  formData.value = {
    name: '',
    category: '',
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sodium: 0
  }
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (editingIngredient.value) {
      await ingredients.update(editingIngredient.value.id, formData.value)
      ElMessage.success('更新成功')
    } else {
      await ingredients.create(formData.value)
      ElMessage.success('添加成功')
    }

    dialogVisible.value = false
    await loadData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  cursor: pointer;
  user-select: none;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}
</style>
