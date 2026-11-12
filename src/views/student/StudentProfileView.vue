<script setup>
import { computed, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { studentPortalApi } from '@/api'
import { getUser } from '@/utils/auth'
import { formatDate } from '@/utils/format'
import { showToast } from '@/utils/toast'

const user = getUser()
const profile = ref(null)
const room = ref(null)
const loading = ref(true)
const error = ref('')

const phone = ref('')
const saving = ref(false)
const saveError = ref('')

const displayName = computed(() => profile.value?.name || user?.name || '学生')
const roomLabel = computed(() => (room.value ? `${room.value.building} ${room.value.roomNo}` : '待分配'))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [profileData, dashboard] = await Promise.all([
      studentPortalApi.profile(user?.studentId),
      studentPortalApi.dashboard(user?.studentId),
    ])
    profile.value = profileData
    room.value = dashboard.room
    phone.value = profileData.phone || ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function savePhone() {
  if (saving.value) return
  saveError.value = ''
  const value = phone.value.trim()
  if (value && !/^1[3-9]\d{9}$/.test(value)) {
    saveError.value = '请输入正确的 11 位手机号'
    return
  }
  saving.value = true
  try {
    const updated = await studentPortalApi.updateProfile(user?.studentId, { phone: value })
    profile.value = { ...profile.value, ...updated, phone: value }
    showToast('联系方式已更新')
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="card loading-block">
    <span class="spinner"></span>
    正在加载个人信息…
  </div>

  <div v-else-if="error" class="card error-card">
    <div class="alert">
      <span>加载失败：{{ error }}</span>
      <button class="btn btn-ghost btn-sm" type="button" @click="load">
        <AppIcon name="refresh" :size="15" />
        重试
      </button>
    </div>
  </div>

  <template v-else>
    <section class="profile-hero">
      <div class="profile-avatar">{{ displayName.slice(0, 1) }}</div>
      <div class="profile-copy">
        <h2>{{ displayName }}</h2>
        <p>学号 {{ profile?.studentNo }} · {{ profile?.className || '班级未填写' }}</p>
        <div class="profile-tags">
          <span class="tag tag-indigo">学生</span>
          <span class="tag" :class="room ? 'tag-green' : 'tag-amber'">{{ room ? '已入住' : '待分配' }}</span>
          <span class="tag tag-gray">{{ profile?.gender || '—' }}生</span>
        </div>
      </div>
      <div class="profile-room">
        <span>我的宿舍</span>
        <strong>{{ roomLabel }}</strong>
        <em v-if="profile?.bedNo">{{ profile.bedNo }} 号床位</em>
      </div>
    </section>

  <section class="profile-grid">
    <article class="card">
      <header class="card-head">
        <div>
          <h2>基本信息</h2>
          <p>以下信息由宿管统一维护</p>
        </div>
      </header>
      <div class="info-grid">
        <div class="info-item">
          <span>学号</span>
          <strong>{{ profile?.studentNo || '—' }}</strong>
        </div>
        <div class="info-item">
          <span>姓名</span>
          <strong>{{ profile?.name || '—' }}</strong>
        </div>
        <div class="info-item">
          <span>性别</span>
          <strong>{{ profile?.gender || '—' }}</strong>
        </div>
        <div class="info-item">
          <span>班级</span>
          <strong>{{ profile?.className || '—' }}</strong>
        </div>
        <div class="info-item">
          <span>入住日期</span>
          <strong>{{ formatDate(profile?.checkInDate) }}</strong>
        </div>
        <div class="info-item">
          <span>房间容量</span>
          <strong>{{ room?.capacity ? `${room.capacity} 人` : '—' }}</strong>
        </div>
      </div>
      <div class="info-note">如需修改姓名、学号或宿舍，请联系宿管老师处理。</div>
    </article>

    <article class="card">
      <header class="card-head">
        <div>
          <h2>联系方式</h2>
          <p>可自行更新联系电话</p>
        </div>
        <span class="tag tag-gray"><AppIcon name="users" :size="13" /> 本人维护</span>
      </header>
      <div class="phone-body">
        <div class="field">
          <label for="profile-phone">联系电话</label>
          <input
            id="profile-phone"
            v-model="phone"
            class="input"
            placeholder="请输入 11 位手机号"
            maxlength="11"
          />
          <span class="hint">用于宿管联系你处理报修等事宜</span>
        </div>
        <div v-if="saveError" class="form-error">{{ saveError }}</div>
        <button class="btn btn-primary save-btn" type="button" :disabled="saving" @click="savePhone">
          <AppIcon name="check" :size="16" />
          {{ saving ? '保存中…' : '保存修改' }}
        </button>
      </div>
    </article>
  </section>
  </template>
</template>

<style scoped>
.error-card {
  padding: 22px;
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 34px;
  border-radius: 22px;
  color: #e8ecf8;
  background: linear-gradient(120deg, #1b2550 0%, #33357f 58%, #4f46e5 100%);
  box-shadow: 0 26px 50px -34px rgba(49, 46, 129, 0.9);
}

.profile-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 26px;
  font-weight: 700;
  color: #fff;
}

.profile-copy {
  flex: 1;
}

.profile-copy h2 {
  font-size: 23px;
  font-weight: 700;
  color: #fff;
}

.profile-copy p {
  margin-top: 4px;
  font-size: 12.5px;
  color: rgba(232, 236, 248, 0.66);
}

.profile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.profile-room {
  flex-shrink: 0;
  text-align: right;
  padding: 12px 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.profile-room span {
  display: block;
  font-size: 11.5px;
  color: rgba(232, 236, 248, 0.6);
}

.profile-room strong {
  display: block;
  margin-top: 2px;
  font-size: 17px;
  color: #fff;
}

.profile-room em {
  display: block;
  font-style: normal;
  margin-top: 2px;
  font-size: 11.5px;
  color: rgba(232, 236, 248, 0.62);
}

.profile-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
  margin-top: 20px;
  align-items: start;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
  padding: 24px;
}

.info-item span {
  display: block;
  font-size: 12px;
  color: var(--muted);
}

.info-item strong {
  display: block;
  margin-top: 3px;
  font-size: 14px;
  color: var(--ink);
  font-weight: 600;
}

.info-note {
  margin: 0 24px 24px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  font-size: 12.5px;
}

.phone-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.save-btn {
  align-self: flex-start;
  height: 38px;
  font-size: 13px;
}

.form-error {
  padding: 10px 14px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 13px;
}

@media (max-width: 1024px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .profile-hero {
    flex-wrap: wrap;
    padding: 24px;
  }

  .profile-room {
    width: 100%;
    text-align: left;
  }
}
</style>
