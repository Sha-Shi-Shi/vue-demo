<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { clearUser, getUser } from '@/utils/auth'
import { useToast } from '@/utils/toast'

const route = useRoute()
const router = useRouter()
const user = ref(getUser())
// localStorage 不是响应式的，切换路由后重新读取，保证登录 / 退出后菜单立即更新
watch(() => route.fullPath, () => { user.value = getUser() }, { immediate: true })
const toast = useToast()
const isPublicPage = computed(() => route.meta.public === true)
const isStudent = computed(() => user.value?.role === 'student')

const adminMenu = [
  { path: '/', label: '数据概览', icon: 'grid' },
  { path: '/rooms', label: '宿舍房间', icon: 'building' },
  { path: '/students', label: '学生入住', icon: 'users' },
  { path: '/repairs', label: '报修管理', icon: 'wrench' },
]

const studentMenu = [
  { path: '/student', label: '我的宿舍', icon: 'building' },
  { path: '/student/repairs', label: '我的报修', icon: 'wrench' },
  { path: '/student/profile', label: '个人信息', icon: 'users' },
]

const menu = computed(() => (isStudent.value ? studentMenu : adminMenu))
const roleLabel = computed(() => (isStudent.value ? '学生' : '超级管理员'))
const displayName = computed(() => user.value?.name || user.value?.username || '用户')

function logout() {
  clearUser()
  router.replace('/login')
}
</script>

<template>
  <RouterView v-if="isPublicPage" />

  <div v-else class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">宿</div>
        <div class="brand-text">
          <strong>智慧宿舍</strong>
          <span>{{ isStudent ? 'STUDENT PORTAL' : 'DORMITORY ADMIN' }}</span>
        </div>
      </div>

      <nav class="nav">
        <RouterLink
          v-for="item in menu"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <AppIcon :name="item.icon" :size="19" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-foot">
        <p>{{ isStudent ? '学生服务入口' : '数据实时同步' }}</p>
        <span>{{ isStudent ? '仅可查看本人数据' : 'Spring Boot · MySQL' }}</span>
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <div class="topbar-title">
          <h1>{{ route.meta.title }}</h1>
          <p>{{ route.meta.subtitle }}</p>
        </div>
        <div class="topbar-user">
          <div class="user-avatar">{{ displayName.slice(0, 1).toUpperCase() }}</div>
          <div class="user-info">
            <strong>{{ displayName }}</strong>
            <span>{{ roleLabel }}</span>
          </div>
          <button class="btn btn-ghost" type="button" @click="logout">
            <AppIcon name="logout" :size="16" />
            退出登录
          </button>
        </div>
      </header>

      <main class="page">
        <RouterView />
      </main>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toast" class="toast" :class="`toast-${toast.type}`">
        {{ toast.message }}
      </div>
    </Transition>
  </Teleport>
</template>
