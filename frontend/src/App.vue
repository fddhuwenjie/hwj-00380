<template>
  <el-container class="app-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="32" color="#409EFF">
          <Food />
        </el-icon>
        <h2>营养管理系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409EFF"
        class="sidebar-menu"
      >
        <el-menu-item index="/ingredients">
          <el-icon><Dish /></el-icon>
          <span>食材库</span>
        </el-menu-item>
        <el-menu-item index="/recipes">
          <el-icon><Notebook /></el-icon>
          <span>食谱管理</span>
        </el-menu-item>
        <el-menu-item index="/meal-plans">
          <el-icon><Calendar /></el-icon>
          <span>饮食计划</span>
        </el-menu-item>
        <el-menu-item index="/shopping-list">
          <el-icon><ShoppingCart /></el-icon>
          <span>购物清单</span>
        </el-menu-item>
        <el-menu-item index="/search">
          <el-icon><Search /></el-icon>
          <span>搜索推荐</span>
        </el-menu-item>
        <el-menu-item index="/diary">
          <el-icon><Document /></el-icon>
          <span>饮食日记</span>
        </el-menu-item>
        <el-menu-item index="/statistics">
          <el-icon><DataLine /></el-icon>
          <span>营养统计</span>
        </el-menu-item>
        <el-menu-item index="/favorites">
          <el-icon><Star /></el-icon>
          <span>我的收藏</span>
        </el-menu-item>
        <el-menu-item index="/community">
          <el-icon><Share /></el-icon>
          <span>食谱社区</span>
        </el-menu-item>
        <el-menu-item index="/suggestions">
          <el-icon><DataAnalysis /></el-icon>
          <span>智能建议</span>
        </el-menu-item>
        <el-menu-item index="/price-trends">
          <el-icon><Histogram /></el-icon>
          <span>价格趋势</span>
        </el-menu-item>
        <el-menu-item index="/data-management">
          <el-icon><Setting /></el-icon>
          <span>数据管理</span>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>体质档案</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="header-right">
          <el-avatar :size="32" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
          <span class="username">管理员</span>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Food, Dish, Notebook, Calendar, ShoppingCart, Search, Document, DataLine, Star, User, Share, DataAnalysis, Histogram, Setting } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => route.path)

const currentPageTitle = computed(() => {
  const titles = {
    '/ingredients': '食材库',
    '/recipes': '食谱管理',
    '/recipes/create': '创建食谱',
    '/meal-plans': '饮食计划',
    '/shopping-list': '购物清单',
    '/search': '搜索推荐',
    '/diary': '饮食日记',
    '/statistics': '营养统计',
    '/favorites': '我的收藏',
    '/community': '食谱社区',
    '/suggestions': '智能建议',
    '/price-trends': '价格趋势',
    '/data-management': '数据管理',
    '/profile': '体质档案'
  }
  const path = route.path.startsWith('/recipes/') && route.path !== '/recipes/create'
    ? '/recipes'
    : route.path
  return titles[path] || '首页'
})
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  overflow: hidden;
}

.logo {
  display: flex;
  align-items: center;
  padding: 20px;
  color: #fff;
  border-bottom: 1px solid #1f3a5f;
}

.logo h2 {
  margin: 0 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 14px;
  color: #606266;
}

.main-content {
  background-color: #f5f7fa;
  padding: 24px;
}
</style>
