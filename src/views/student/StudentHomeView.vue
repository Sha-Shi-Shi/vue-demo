<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { studentPortalApi } from '@/api'
import { getUser } from '@/utils/auth'
import { formatDate } from '@/utils/format'

const user = getUser()
const loading = ref(true)
const error = ref('')
const data = ref(null)

const student = computed(() => data.value?.student || {})
const room = computed(() => data.value?.room || null)
const roommates = computed(() => data.value?.roommates || [])
const repairStats = computed(() => data.value?.repairStats || { pending: 0, processing: 0, completed: 0 })
const occupancyRate = computed(() => {
  if (!room.value || !room.value.capacity) return 0
  return Math.min(Math.round((room.value.used / room.value.capacity) * 100), 100)
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await studentPortalApi.dashboard(user?.studentId)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div v-if="loading" class="card loading-block">
    <span class="spinner"></span>
    正在加载我的宿舍信息…
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
    <section class="student-hero">
      <div class="hero-avatar">{{ (student.name || user?.name || '学').slice(0, 1) }}</div>
      <div class="hero-copy">
        <span class="hero-badge">学生端 · 我的宿舍</span>
        <h2>你好，{{ student.name || user?.name || '同学' }}</h2>
        <p>
          {{ student.className || '班级未填写' }} · 学号 {{ student.studentNo || user?.username }}
        </p>
        <div class="hero-tags">
          <span v-if="room"><AppIcon name="building" :size="14" />{{ room.building }} {{ room.roomNo }}</span>
          <span v-if="room"><AppIcon name="bed" :size="14" />{{ student.bedNo }} 号床位</span>
          <span v-else class="tag-pending">宿舍待分配</span>
        </div>
      </div>
      <div class="hero-actions">
        <RouterLink class="btn hero-btn" :to="{ path: '/student/repairs' }">
          <AppIcon name="wrench" :size="16" />
          我的报修
        </RouterLink>
        <RouterLink class="btn hero-btn ghost" :to="{ path: '/student/profile' }">
          <AppIcon name="users" :size="16" />
          个人信息
        </RouterLink>
      </div>
    </section>

    <section class="student-grid">
      <article class="card">
        <header class="card-head">
          <div>
            <h2>我的宿舍</h2>
            <p>房间信息与室友一览</p>
          </div>
          <span v-if="room" class="tag tag-green">已入住</span>
          <span v-else class="tag tag-amber">待分配</span>
        </header>

        <div v-if="room" class="room-body">
          <div class="room-title">
            <div>
              <strong>{{ room.building }} {{ room.roomNo }}</strong>
              <span>{{ room.floor }} 层 · {{ room.gender }}生宿舍</span>
            </div>
            <div class="room-capacity">
              <em>{{ room.used }}<i>/{{ room.capacity }}</i></em>
              <span>在住人数</span>
            </div>
          </div>

          <div class="track-row">
            <span>入住率 {{ occupancyRate }}%</span>
            <span>空余 {{ room.available }} 个床位</span>
          </div>
          <div class="track"><span :style="{ width: `${occupancyRate}%` }"></span></div>

          <div class="room-meta">
            <div><span>入住日期</span><strong>{{ formatDate(student.checkInDate) }}</strong></div>
            <div><span>床位号</span><strong>{{ student.bedNo }} 号床</strong></div>
            <div><span>房间容量</span><strong>{{ room.capacity }} 人</strong></div>
          </div>

          <div class="roommate-head">
            <strong>室友</strong>
            <span>共 {{ roommates.length }} 人</span>
          </div>
          <div v-if="roommates.length" class="roommate-list">
            <div v-for="mate in roommates" :key="mate.id" class="roommate">
              <div class="mate-avatar">{{ (mate.name || '舍').slice(0, 1) }}</div>
              <div class="mate-info">
                <strong>{{ mate.name }}</strong>
                <span>{{ mate.studentNo }} · {{ mate.bedNo }} 号床</span>
              </div>
            </div>
          </div>
          <div v-else class="empty">暂无室友信息</div>
        </div>

        <div v-else class="empty unassigned">
          <div class="empty-icon"><AppIcon name="bed" :size="24" /></div>
          尚未分配宿舍，请联系宿管老师办理入住
        </div>
      </article>

      <div class="side-col">
        <article class="card">
          <header class="card-head">
            <div>
              <h2>报修概览</h2>
              <p>我的报修工单进度</p>
            </div>
          </header>
          <div class="repair-stats">
            <RouterLink class="repair-stat" :to="{ path: '/student/repairs', query: { status: '待处理' } }">
              <span class="dot amber"></span>
              <div>
                <strong>{{ repairStats.pending }}</strong>
                <span>待处理</span>
              </div>
            </RouterLink>
            <RouterLink class="repair-stat" :to="{ path: '/student/repairs', query: { status: '处理中' } }">
              <span class="dot blue"></span>
              <div>
                <strong>{{ repairStats.processing ?? 0 }}</strong>
                <span>处理中</span>
              </div>
            </RouterLink>
            <RouterLink class="repair-stat" :to="{ path: '/student/repairs', query: { status: '已完成' } }">
              <span class="dot green"></span>
              <div>
                <strong>{{ repairStats.completed }}</strong>
                <span>已完成</span>
              </div>
            </RouterLink>
          </div>
          <RouterLink class="btn btn-soft report-btn" :to="{ path: '/student/repairs' }">
            <AppIcon name="plus" :size="16" />
            提交新报修
          </RouterLink>
        </article>

        <article class="card notice-card">
          <h3>宿舍小贴士</h3>
          <ul>
            <li>离开宿舍请关闭电源与水源，注意用电安全。</li>
            <li>报修提交后可在「我的报修」查看处理进度。</li>
            <li>个人信息中的联系电话如有变更，请及时更新。</li>
          </ul>
        </article>
      </div>
    </section>
  </template>
</template>

<style scoped>
.error-card {
  padding: 22px;
}

.student-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 30px 36px;
  border-radius: 22px;
  color: #e8ecf8;
  background: linear-gradient(120deg, #1b2550 0%, #33357f 58%, #4f46e5 100%);
  box-shadow: 0 26px 50px -34px rgba(49, 46, 129, 0.9);
}

.hero-avatar {
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

.hero-copy {
  flex: 1;
}

.hero-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 11.5px;
  letter-spacing: 0.05em;
  color: rgba(232, 236, 248, 0.85);
}

.hero-copy h2 {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.hero-copy p {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(232, 236, 248, 0.66);
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.hero-tags span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 11px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: rgba(232, 236, 248, 0.92);
}

.tag-pending {
  background: rgba(251, 191, 36, 0.2) !important;
  color: #fde68a !important;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.hero-btn {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  height: 38px;
  font-size: 13px;
}

.hero-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}

.hero-btn.ghost {
  background: transparent;
}

.student-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-top: 20px;
  align-items: start;
}

.room-body {
  padding: 24px;
}

.room-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.room-title strong {
  font-size: 20px;
  color: var(--ink);
  font-weight: 700;
}

.room-title span {
  display: block;
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--muted);
}

.room-capacity {
  text-align: right;
}

.room-capacity em {
  font-style: normal;
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.room-capacity em i {
  font-style: normal;
  font-size: 14px;
  color: var(--muted);
}

.room-capacity span {
  display: block;
  font-size: 11.5px;
  color: var(--muted);
}

.track-row {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  font-size: 12px;
  color: var(--muted);
}

.track {
  margin-top: 8px;
  height: 8px;
  border-radius: 999px;
  background: #f1f3fa;
  overflow: hidden;
}

.track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}

.room-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 22px;
  padding: 16px;
  border-radius: 12px;
  background: #f8f9ff;
  border: 1px solid #eef0fb;
}

.room-meta span {
  display: block;
  font-size: 11.5px;
  color: var(--muted);
}

.room-meta strong {
  display: block;
  margin-top: 4px;
  font-size: 13.5px;
  color: var(--ink);
  font-weight: 600;
}

.roommate-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 26px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-soft);
}

.roommate-head strong {
  font-size: 14px;
  color: var(--ink);
}

.roommate-head span {
  font-size: 12px;
  color: var(--muted);
}

.roommate-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.roommate {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 11px;
  border: 1px solid var(--line-soft);
  background: #fcfdff;
}

.mate-avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.mate-info strong {
  display: block;
  font-size: 13px;
  color: var(--ink);
  font-weight: 600;
}

.mate-info span {
  display: block;
  font-size: 11.5px;
  color: var(--muted);
}

.unassigned {
  padding: 64px 24px;
}

.side-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.repair-stats {
  padding: 20px 24px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.repair-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 10px;
  transition: background 0.16s ease;
}

.repair-stat:hover {
  background: #f8f9ff;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.amber {
  background: #f59e0b;
}

.dot.blue {
  background: #3b82f6;
}

.dot.green {
  background: #10b981;
}

.repair-stat div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.repair-stat strong {
  font-size: 19px;
  color: var(--ink);
  font-weight: 700;
}

.repair-stat div span {
  font-size: 12.5px;
  color: var(--muted);
}

.report-btn {
  margin: 8px 24px 24px;
  height: 38px;
  font-size: 13px;
}

.notice-card {
  padding: 22px 24px;
}

.notice-card h3 {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--ink);
}

.notice-card ul {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice-card li {
  position: relative;
  padding-left: 16px;
  font-size: 12.5px;
  line-height: 1.7;
  color: #64748b;
}

.notice-card li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 8px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c7cdf0;
}

@media (max-width: 1180px) {
  .student-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .student-hero {
    flex-wrap: wrap;
    padding: 24px;
  }

  .hero-actions {
    flex-direction: row;
    width: 100%;
  }

  .roommate-list {
    grid-template-columns: 1fr;
  }

  .room-meta {
    grid-template-columns: 1fr;
  }
}
</style>
