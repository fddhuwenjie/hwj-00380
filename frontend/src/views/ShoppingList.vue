<template>
  <div class="shopping-list-page">
    <div class="page-header">
      <h2 class="page-title">购物清单</h2>
      <div class="header-actions">
        <el-select
          v-model="selectedPlanId"
          placeholder="选择饮食计划"
          style="width: 200px; margin-right: 12px;"
          @change="loadShoppingList(selectedPlanId)"
        >
          <el-option
            v-for="plan in mealPlans.list"
            :key="plan.id"
            :label="plan.name"
            :value="plan.id"
          />
        </el-select>
        <el-button @click="loadShoppingList(selectedPlanId)">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="exportText">
          <el-icon><Download /></el-icon>
          导出文本
        </el-button>
      </div>
    </div>

    <div class="card">
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">总项数</span>
          <span class="stat-value">{{ totalItems }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已购买</span>
          <span class="stat-value">{{ purchasedCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">预估总价</span>
          <span class="stat-value price">¥{{ totalEstimatedPrice.toFixed(2) }}</span>
        </div>
        <div class="stat-progress">
          <el-progress
            :percentage="purchasePercentage"
            :stroke-width="8"
            :color="progressColor"
          />
        </div>
      </div>

      <el-collapse v-model="activeCollapse" accordion>
        <el-collapse-item
          v-for="category in categoryOrder"
          :key="category"
          :name="category"
          :title="`${category} (${getCategoryItems(category).length})`"
        >
          <div class="shopping-items">
            <div
              v-for="item in getCategoryItems(category)"
              :key="item.id"
              class="shopping-item"
              :class="{ purchased: item.is_purchased }"
            >
              <el-checkbox
                :model-value="item.is_purchased"
                @change="togglePurchased(item)"
              />
              <span class="item-name">{{ item.name }}</span>
              <span class="item-amount">{{ item.amount }} g</span>
              <span class="item-price" v-if="item.price_per_500g !== null && item.price_per_500g !== undefined">
                ¥{{ item.estimated_price?.toFixed(2) || '0.00' }}
                <span class="unit-price">(¥{{ item.price_per_500g?.toFixed(2) || '0.00' }}/500g)</span>
              </span>
              <span class="item-price no-price" v-else>
                --
              </span>
              <el-button
                v-if="item.is_manual"
                type="danger"
                link
                size="small"
                @click="removeItem(item)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-empty
              v-if="getCategoryItems(category).length === 0"
              description="暂无物品"
              :image-size="40"
            />
          </div>
        </el-collapse-item>
      </el-collapse>

      <div class="add-item-section">
        <h4 class="section-title">手动添加</h4>
        <div class="add-item-form">
          <el-input
            v-model="newItemName"
            placeholder="输入食材名称"
            style="width: 200px; margin-right: 12px;"
            @keyup.enter="addManualItem"
          />
          <el-input-number
            v-model="newItemAmount"
            :min="1"
            :max="10000"
            placeholder="用量(g)"
            style="width: 150px; margin-right: 12px;"
          />
          <el-select
            v-model="newItemCategory"
            placeholder="选择分类"
            style="width: 150px; margin-right: 12px;"
          >
            <el-option
              v-for="cat in categoryOrder.filter(c => c !== '手动添加')"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
          <el-button type="primary" @click="addManualItem">
            <el-icon><Plus /></el-icon>
            添加
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useShoppingListStore, useMealPlanStore } from '@/store'
import { Refresh, Download, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const shoppingListStore = useShoppingListStore()
const mealPlans = useMealPlanStore()

const selectedPlanId = ref(null)
const activeCollapse = ref('肉类')
const newItemName = ref('')
const newItemAmount = ref(100)
const newItemCategory = ref('其他')

const categoryOrder = [
  '肉类',
  '蔬菜',
  '水果',
  '谷物',
  '调料',
  '蛋奶',
  '水产',
  '坚果',
  '豆类',
  '其他',
  '手动添加'
]

const listData = computed(() => {
  const items = shoppingListStore.list || []
  const grouped = {}
  
  categoryOrder.forEach(cat => {
    grouped[cat] = []
  })
  
  items.forEach(item => {
    let category = item.category || '其他'
    if (item.is_manual) {
      category = '手动添加'
    }
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(item)
  })
  
  return categoryOrder.map(cat => ({
    category: cat,
    items: grouped[cat] || []
  }))
})

const totalItems = computed(() => {
  return shoppingListStore.list?.length || 0
})

const purchasedCount = computed(() => {
  return shoppingListStore.list?.filter(item => item.is_purchased)?.length || 0
})

const purchasePercentage = computed(() => {
  if (totalItems.value === 0) return 0
  return Math.round((purchasedCount.value / totalItems.value) * 100)
})

const progressColor = computed(() => {
  if (purchasePercentage.value >= 100) return '#67c23a'
  if (purchasePercentage.value >= 50) return '#e6a23c'
  return '#409eff'
})

const totalEstimatedPrice = computed(() => {
  const list = shoppingListStore.list || []
  return list.reduce((total, item) => {
    if (item.estimated_price !== null && item.estimated_price !== undefined) {
      return total + item.estimated_price
    }
    return total
  }, 0)
})

const getCategoryItems = (category) => {
  const categoryData = listData.value.find(c => c.category === category)
  return categoryData?.items || []
}

const loadShoppingList = async (planId) => {
  try {
    const params = planId ? { mealPlanId: planId } : {}
    await shoppingListStore.fetchList(params)
    ElMessage.success('清单已刷新')
  } catch (err) {
    ElMessage.error(err.message || '加载失败')
  }
}

const togglePurchased = async (item) => {
  try {
    await shoppingListStore.toggle(item.id)
    await loadShoppingList(selectedPlanId.value)
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  }
}

const addManualItem = async () => {
  if (!newItemName.value.trim()) {
    ElMessage.warning('请输入食材名称')
    return
  }
  
  try {
    await shoppingListStore.add({
      name: newItemName.value.trim(),
      amount: newItemAmount.value,
      category: newItemCategory.value,
      is_manual: true
    })
    newItemName.value = ''
    newItemAmount.value = 100
    newItemCategory.value = '其他'
    activeCollapse.value = '手动添加'
    await loadShoppingList(selectedPlanId.value)
    ElMessage.success('添加成功')
  } catch (err) {
    ElMessage.error(err.message || '添加失败')
  }
}

const removeItem = async (item) => {
  try {
    await shoppingListStore.remove(item.id)
    await loadShoppingList(selectedPlanId.value)
    ElMessage.success('已删除')
  } catch (err) {
    ElMessage.error(err.message || '删除失败')
  }
}

const exportText = () => {
  const items = shoppingListStore.list || []
  if (items.length === 0) {
    ElMessage.warning('清单为空，无法导出')
    return
  }
  
  const lines = ['购物清单', '================']
  const grouped = {}
  
  items.forEach(item => {
    const category = item.is_manual ? '手动添加' : (item.category || '其他')
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(item)
  })
  
  categoryOrder.forEach(cat => {
    if (grouped[cat] && grouped[cat].length > 0) {
      lines.push('')
      lines.push(`【${cat}】`)
      grouped[cat].forEach(item => {
        const status = item.is_purchased ? '[✓]' : '[ ]'
        lines.push(`${status} ${item.name} - ${item.amount}g`)
      })
    }
  })
  
  lines.push('')
  lines.push(`总计: ${totalItems.value} 项, 已购买: ${purchasedCount.value} 项`)
  lines.push(`完成度: ${purchasePercentage.value}%`)
  
  const text = lines.join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `购物清单_${new Date().toLocaleDateString()}.txt`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('导出成功')
}

const loadData = async () => {
  try {
    await mealPlans.fetchList()
    if (mealPlans.list.length > 0) {
      selectedPlanId.value = mealPlans.list[0].id
      await loadShoppingList(selectedPlanId.value)
    } else {
      await loadShoppingList(null)
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
.shopping-list-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
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
  align-items: center;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: #606266;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
}

.stat-progress {
  flex: 1;
  max-width: 400px;
}

.shopping-items {
  padding: 12px 0;
}

.shopping-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  transition: all 0.3s ease;
}

.shopping-item:last-child {
  border-bottom: none;
}

.shopping-item:hover {
  background: #f5f7fa;
}

.shopping-item.purchased .item-name {
  text-decoration: line-through;
  color: #c0c4cc;
}

.item-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
  transition: all 0.3s ease;
}

.item-amount {
  font-size: 14px;
  font-weight: 500;
  color: #409eff;
  min-width: 80px;
  text-align: right;
}

.add-item-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.add-item-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

:deep(.el-collapse-item__header) {
  font-weight: 500;
}

:deep(.el-collapse-item__content) {
  padding: 0 8px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .header-actions .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .stats-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .stat-progress {
    width: 100%;
    max-width: none;
  }

  .add-item-form {
    flex-direction: column;
    align-items: stretch;
  }

  .add-item-form .el-input,
  .add-item-form .el-input-number,
  .add-item-form .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }
}

.stat-value.price {
  color: #F56C6C;
  font-weight: 700;
}

.item-price {
  font-size: 14px;
  font-weight: 600;
  color: #F56C6C;
  min-width: 160px;
  text-align: right;
}

.item-price.no-price {
  color: #C0C4CC;
  font-weight: normal;
}

.unit-price {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  margin-left: 4px;
}

.shopping-item.purchased .item-price {
  color: #c0c4cc;
}

.shopping-item.purchased .unit-price {
  color: #c0c4cc;
}
</style>
