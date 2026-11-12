<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { authApi } from '@/api'

const router = useRouter()
const form = reactive({
  studentNo: '',
  name: '',
  gender: '男',
  className: '',
  phone: '',
  password: '',
  confirmPassword: '',
})
const loading = ref(false)
const error = ref('')

async function submit() {
  if (loading.value) return
  error.value = ''
  if (!form.studentNo.trim() || !form.name.trim()) {
    error.value = '请填写学号和姓名'
    return
  }
  if (form.password.length < 6) {
    error.value = '密码长度至少 6 位'
    return
  }
  if (form.password !== form.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }
  loading.value = true
  try {
    await authApi.register({
      studentNo: form.studentNo.trim(),
      name: form.name.trim(),
      gender: form.gender,
      className: form.className.trim(),
      phone: form.phone.trim(),
      password: form.password,
    })
    router.replace({
      path: '/login',
      query: { role: 'student', registered: '1', studentNo: form.studentNo.trim() },
    })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-wrap">
      <header class="register-head">
        <RouterLink class="btn btn-ghost btn-sm back-btn" :to="{ path: '/login' }">
          <AppIcon name="logout" :size="15" />
          返回登录
        </RouterLink>
        <div class="register-brand">
          <div class="register-logo">宿</div>
          <span>STUDENT REGISTER</span>
        </div>
        <h1>注册学生账号</h1>
        <p>填写个人基本信息后即可登录学生端，宿舍床位由宿管统一分配。</p>
      </header>

      <form class="card register-card" @submit.prevent="submit">
        <div class="form-grid">
          <div class="field">
            <label for="register-no">学号</label>
            <input
              id="register-no"
              v-model="form.studentNo"
              class="input"
              placeholder="请输入学号"
              autocomplete="username"
            />
          </div>
          <div class="field">
            <label for="register-name">姓名</label>
            <input id="register-name" v-model="form.name" class="input" placeholder="请输入真实姓名" />
          </div>
          <div class="field">
            <label for="register-gender">性别</label>
            <select id="register-gender" v-model="form.gender" class="select">
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div class="field">
            <label for="register-class">班级</label>
            <input id="register-class" v-model="form.className" class="input" placeholder="如：计算机2301" />
          </div>
          <div class="field span-2">
            <label for="register-phone">联系电话</label>
            <input id="register-phone" v-model="form.phone" class="input" placeholder="选填" />
          </div>
          <div class="field">
            <label for="register-password">密码</label>
            <input
              id="register-password"
              v-model="form.password"
              class="input"
              type="password"
              placeholder="至少 6 位"
              autocomplete="new-password"
            />
          </div>
          <div class="field">
            <label for="register-confirm">确认密码</label>
            <input
              id="register-confirm"
              v-model="form.confirmPassword"
              class="input"
              type="password"
              placeholder="请再次输入密码"
              autocomplete="new-password"
            />
          </div>
        </div>

        <div v-if="error" class="register-error">{{ error }}</div>

        <div class="register-tip">
          注册仅创建学生账号，宿舍与床位由管理员在「学生入住」中分配。
        </div>

        <div class="register-actions">
          <RouterLink class="btn btn-ghost" :to="{ path: '/login' }">取消</RouterLink>
          <button class="btn btn-primary" type="submit" :disabled="loading">
            {{ loading ? '注册中…' : '注册账号' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 56px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(800px 400px at 85% -5%, rgba(99, 102, 241, 0.14), transparent 62%),
    radial-gradient(600px 360px at 5% 100%, rgba(56, 189, 248, 0.12), transparent 60%),
    var(--bg);
}

.register-wrap {
  width: 100%;
  max-width: 720px;
}

.register-head {
  position: relative;
  padding: 8px 4px 26px;
  text-align: center;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
}

.register-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.register-logo {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 12px 24px -12px rgba(139, 92, 246, 0.9);
}

.register-brand span {
  font-size: 11px;
  letter-spacing: 0.2em;
  color: #94a3b8;
}

.register-head h1 {
  font-size: 27px;
  font-weight: 700;
  color: var(--ink);
}

.register-head p {
  margin-top: 8px;
  font-size: 13px;
  color: var(--muted);
}

.register-card {
  padding: 30px 32px 26px;
}

.register-error {
  margin-top: 18px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 13px;
}

.register-tip {
  margin-top: 18px;
  padding: 11px 14px;
  border-radius: 10px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  font-size: 12.5px;
}

.register-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

@media (max-width: 640px) {
  .register-page {
    padding: 24px 14px;
  }

  .register-head {
    padding-top: 48px;
  }

  .register-card {
    padding: 22px 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: span 1;
  }
}
</style>
