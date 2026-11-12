<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { authApi } from '@/api'
import { setUser } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const mode = ref('student')
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')
const notice = ref('')

const isStudent = computed(() => mode.value === 'student')

onMounted(() => {
  if (route.query.role === 'admin' || route.query.role === 'student') {
    mode.value = route.query.role
  }
  if (route.query.studentNo) {
    mode.value = 'student'
    form.username = String(route.query.studentNo)
  }
  if (route.query.registered === '1') {
    notice.value = '注册成功，请使用学号登录'
  }
})

function switchMode(next) {
  if (mode.value === next) return
  mode.value = next
  form.username = ''
  form.password = ''
  error.value = ''
  notice.value = ''
}

function fillDemo() {
  form.username = 'admin'
  form.password = '123456'
  error.value = ''
}

async function submit() {
  if (loading.value) return
  error.value = ''
  notice.value = ''
  if (!form.username || !form.password) {
    error.value = isStudent.value ? '请输入学号和密码' : '请输入账号和密码'
    return
  }
  loading.value = true
  try {
    const data = await authApi.login({
      role: mode.value,
      username: form.username,
      password: form.password,
    })
    const role = data.role || mode.value
    setUser({ ...data, role })
    router.replace(role === 'student' ? '/student' : '/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-left">
      <span class="glow glow-a"></span>
      <span class="glow glow-b"></span>

      <div class="login-left-inner">
        <div class="login-brand">
          <div class="login-logo">宿</div>
          <span>DORMITORY OS</span>
        </div>

        <h2>智慧宿舍<br />管理系统</h2>
        <p class="lead">学生自助查询与报修，宿管全局管理，一套系统连接宿舍生活的每个环节。</p>

        <ul class="feature-list">
          <li>
            <i>01</i>
            <div>
              <strong>学生服务自助</strong>
              <span>查看我的宿舍、室友信息与报修进度</span>
            </div>
          </li>
          <li>
            <i>02</i>
            <div>
              <strong>报修全程跟踪</strong>
              <span>学生提交，宿管处理，状态实时同步</span>
            </div>
          </li>
          <li>
            <i>03</i>
            <div>
              <strong>宿管全局掌控</strong>
              <span>房间、床位、学生入住数据一站式管理</span>
            </div>
          </li>
        </ul>

        <div class="brand-foot">Spring Boot · Vue 3 · MySQL</div>
      </div>
    </section>

    <section class="login-right">
      <form class="login-card" @submit.prevent="submit">
        <header>
          <span class="eyebrow">{{ isStudent ? '学生端' : '楼宇管理端' }}</span>
          <h1>欢迎回来</h1>
          <p>{{ isStudent ? '使用学号登录，查看我的宿舍与报修' : '使用管理员账号登录宿舍管理后台' }}</p>
        </header>

        <div class="role-switch">
          <button
            type="button"
            class="role-btn"
            :class="{ active: mode === 'student' }"
            @click="switchMode('student')"
          >
            <AppIcon name="users" :size="17" />
            学生登录
          </button>
          <button
            type="button"
            class="role-btn"
            :class="{ active: mode === 'admin' }"
            @click="switchMode('admin')"
          >
            <AppIcon name="building" :size="17" />
            管理员登录
          </button>
        </div>

        <div v-if="notice" class="login-notice">{{ notice }}</div>

        <div class="field">
          <label for="username">{{ isStudent ? '学号' : '管理员账号' }}</label>
          <div class="input-wrap">
            <AppIcon name="users" :size="17" />
            <input
              id="username"
              v-model.trim="form.username"
              class="input"
              :placeholder="isStudent ? '请输入学号' : '请输入管理员账号'"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="field">
          <label for="password">密码</label>
          <div class="input-wrap">
            <AppIcon name="lock" :size="17" />
            <input
              id="password"
              v-model.trim="form.password"
              type="password"
              class="input"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </div>
        </div>

        <div v-if="error" class="login-error">{{ error }}</div>

        <button class="btn btn-primary login-btn" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : '登 录' }}
        </button>

        <button v-if="!isStudent" class="demo-tip" type="button" @click="fillDemo">
          演示账号 <code>admin</code> / <code>123456</code> · 点击自动填入
        </button>
        <RouterLink
          v-else-if="isStudent"
          class="demo-tip link-tip"
          :to="{ path: '/register' }"
        >
          还没有学生账号？<strong>立即注册</strong>
        </RouterLink>
      </form>

      <p class="login-copy">智慧宿舍管理系统 · 教学演示项目</p>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  background: #f4f6fb;
}

.login-left {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 64px 72px;
  color: #e8ecf8;
  background: linear-gradient(150deg, #101830 0%, #1b2550 55%, #2b2f74 100%);
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(6px);
  pointer-events: none;
}

.glow-a {
  width: 420px;
  height: 420px;
  right: -140px;
  top: -120px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.55), transparent 68%);
}

.glow-b {
  width: 360px;
  height: 360px;
  left: -120px;
  bottom: -140px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.28), transparent 68%);
}

.login-left-inner {
  position: relative;
  z-index: 1;
  max-width: 480px;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 52px;
}

.login-logo {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 14px 30px -12px rgba(139, 92, 246, 0.9);
}

.login-brand span {
  font-size: 12px;
  letter-spacing: 0.22em;
  color: rgba(232, 236, 248, 0.55);
}

.login-left h2 {
  font-size: 42px;
  line-height: 1.25;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
}

.login-left .lead {
  margin-top: 18px;
  font-size: 15px;
  line-height: 1.8;
  color: rgba(232, 236, 248, 0.68);
  max-width: 400px;
}

.feature-list {
  margin-top: 44px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.feature-list i {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
  color: #c7d2fe;
}

.feature-list div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-list strong {
  font-size: 14.5px;
  color: #fff;
  font-weight: 600;
}

.feature-list span {
  font-size: 12.5px;
  color: rgba(232, 236, 248, 0.55);
}

.brand-foot {
  margin-top: 56px;
  font-size: 11.5px;
  letter-spacing: 0.12em;
  color: rgba(232, 236, 248, 0.35);
}

.login-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 56px 32px;
}

.login-card {
  width: 100%;
  max-width: 430px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 38px 38px 30px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 22px;
  box-shadow: 0 30px 70px -40px rgba(15, 23, 42, 0.45);
}

.login-card header {
  margin-bottom: 2px;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
}

.login-card h1 {
  font-size: 27px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.01em;
}

.login-card header p {
  margin-top: 8px;
  font-size: 13px;
  color: var(--muted);
}

.role-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 5px;
  border-radius: 13px;
  background: #f4f5fb;
  border: 1px solid var(--line);
}

.role-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.role-btn:hover {
  color: var(--ink);
}

.role-btn.active {
  background: #fff;
  color: var(--primary);
  box-shadow: 0 6px 16px -10px rgba(15, 23, 42, 0.4);
}

.login-notice {
  padding: 10px 14px;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
  font-size: 13px;
}

.input-wrap {
  position: relative;
}

.input-wrap .app-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9aa4b6;
  pointer-events: none;
}

.input-wrap .input {
  height: 46px;
  padding-left: 42px;
  font-size: 14px;
}

.login-error {
  padding: 10px 14px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 13px;
}

.login-btn {
  height: 46px;
  margin-top: 2px;
  font-size: 15px;
  letter-spacing: 0.1em;
}

.demo-tip {
  border: 1px dashed #d7dbea;
  border-radius: 10px;
  background: #fafbff;
  padding: 10px 12px;
  font-size: 12.5px;
  color: var(--muted);
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease;
  text-align: center;
}

.demo-tip:hover {
  border-color: #c7cdf0;
  background: #f4f5ff;
}

.demo-tip code {
  padding: 1px 6px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid var(--line);
  color: var(--primary);
  font-weight: 600;
}

.link-tip strong {
  color: var(--primary);
  font-weight: 600;
}

.login-copy {
  font-size: 12px;
  color: #9aa4b6;
}

@media (max-width: 980px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-left {
    display: none;
  }
}

@media (max-width: 520px) {
  .login-right {
    padding: 28px 18px;
  }

  .login-card {
    padding: 28px 22px 24px;
  }
}
</style>
