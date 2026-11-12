import { createRouter, createWebHistory } from 'vue-router'
import { getUser } from '@/utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true, title: '登录' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true, title: '学生注册' },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { role: 'admin', title: '数据概览', subtitle: '宿舍运行状况总览' },
    },
    {
      path: '/rooms',
      name: 'rooms',
      component: () => import('@/views/RoomsView.vue'),
      meta: { role: 'admin', title: '宿舍房间', subtitle: '楼栋、房间与床位管理' },
    },
    {
      path: '/students',
      name: 'students',
      component: () => import('@/views/StudentsView.vue'),
      meta: { role: 'admin', title: '学生入住', subtitle: '入住登记与床位分配' },
    },
    {
      path: '/repairs',
      name: 'repairs',
      component: () => import('@/views/RepairsView.vue'),
      meta: { role: 'admin', title: '报修管理', subtitle: '报修工单跟踪与处理' },
    },
    {
      path: '/student',
      name: 'student-home',
      component: () => import('@/views/student/StudentHomeView.vue'),
      meta: { role: 'student', title: '我的宿舍', subtitle: '宿舍与室友信息' },
    },
    {
      path: '/student/repairs',
      name: 'student-repairs',
      component: () => import('@/views/student/StudentRepairsView.vue'),
      meta: { role: 'student', title: '我的报修', subtitle: '提交与查看报修进度' },
    },
    {
      path: '/student/profile',
      name: 'student-profile',
      component: () => import('@/views/student/StudentProfileView.vue'),
      meta: { role: 'student', title: '个人信息', subtitle: '个人资料与住宿信息' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const user = getUser()
  if (!to.meta.public && !user) {
    return { name: 'login' }
  }
  if (user && to.meta.public) {
    return { name: user.role === 'student' ? 'student-home' : 'dashboard' }
  }
  if (to.meta.role && user && user.role !== to.meta.role) {
    return { name: user.role === 'student' ? 'student-home' : 'dashboard' }
  }
  return true
})

export default router
