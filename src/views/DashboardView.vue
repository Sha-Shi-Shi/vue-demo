<script setup>
import { computed, onMounted, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { overviewApi } from '@/api'
import { getUser } from '@/utils/auth'
import { formatDateTime, statusTagClass } from '@/utils/format'

const loading = ref(true)
const error = ref('')
const data = ref(null)
const user = getUser()

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await overviewApi.get()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const stats = computed(() => {
  const d = data.value || {}
  return [
    {
      label: '学生总数',
      value: d.studentCount ?? 0,
      unit: '人',
      icon: 'users',
      tone: 'indigo',
      foot: `${d.roomCount ?? 0} 间宿舍在管`,
    },
    {
      label: '可用床位',
      value: d.availableBeds ?? 0,
      unit: '个',
      icon: 'bed',
      tone: 'green',
      foot: `总床位 ${d.totalBeds ?? 0} 个`,
    },
    {
      label: '整体入住率',
      value: d.occupancyRate ?? 0,
      unit: '%',
      icon: 'activity',
      tone: 'amber',
      foot: `已入住 ${d.occupiedBeds ?? 0} 人`,
    },
    {
      label: '待处理报修',
      value: d.pendingRepairs ?? 0,
      unit: '单',
      icon: 'wrench',
      tone: 'red',
      foot: `处理中 ${d.processingRepairs ?? 0} 单`,
    },
  ]
})
</script>

<template>
  <div v-if="loading" class="card loading-block">
    <span class="spinner"></span>
    正在加载宿舍数据…
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
    <section class="hero">
      <span class="hero-glow"></span>
      <div class="hero-copy">
        <span class="hero-badge">宿舍运行总览</span>
        <h2>{{ greeting }}，{{ user?.username || '管理员' }}</h2>
        <p>
          目前共有 {{ data.roomCount }} 间宿舍、{{ data.totalBeds }} 个床位，已入住
          {{ data.occupiedBeds }} 人，还有 {{ data.availableBeds }} 个床位可分配。
        </p>
        <div class="hero-chips">
          <span><i></i>待处理报修 {{ data.pendingRepairs }} 单</span>
          <span><i></i>处理中 {{ data.processingRepairs }} 单</span>
        </div>
      </div>

      <div class="hero-ring" :style="{ '--rate': `${data.occupancyRate}%` }">
        <div class="hero-ring-inner">
          <strong>{{ data.occupancyRate }}<i>%</i></strong>
          <span>整体入住率</span>
        </div>
      </div>
    </section>

    <section class="stat-grid">
      <article v-for="item in stats" :key="item.label" class="card stat-card">
        <div class="stat-top">
          <span class="stat-icon" :class="`tone-${item.tone}`">
            <AppIcon :name="item.icon" :size="20" />
          </span>
          <span class="stat-label">{{ item.label }}</span>
        </div>
        <div class="stat-value">
          {{ item.value }}<small>{{ item.unit }}</small>
        </div>
        <div class="stat-foot">{{ item.foot }}</div>
      </article>
    </section>

    <section class="dash-grid">
      <article class="card">
        <header class="card-head">
          <div>
            <h2>楼栋入住情况</h2>
            <p>各宿舍楼已入住床位与总容量对比</p>
          </div>
          <RouterLink class="btn btn-ghost btn-sm" to="/rooms">
            查看房间
            <AppIcon name="arrow" :size="15" />
          </RouterLink>
        </header>

        <div class="building-list">
          <div v-for="item in data.buildingStats" :key="item.building" class="building-item">
            <div class="building-row">
              <strong>{{ item.building }}</strong>
              <span>{{ item.used }} / {{ item.beds }} 床位</span>
              <em>{{ item.rate }}%</em>
            </div>
            <div class="track">
              <span :style="{ width: `${Math.min(item.rate, 100)}%` }"></span>
            </div>
            <div class="building-sub">{{ item.rooms }} 间宿舍</div>
          </div>
          <div v-if="!data.buildingStats.length" class="empty">暂无宿舍数据</div>
        </div>
      </article>

      <article class="card">
        <header class="card-head">
          <div>
            <h2>最新报修</h2>
            <p>最近提交的报修工单</p>
          </div>
          <RouterLink class="btn btn-ghost btn-sm" to="/repairs">
            全部工单
            <AppIcon name="arrow" :size="15" />
          </RouterLink>
        </header>

        <div v-if="data.recentRepairs.length" class="repair-list">
          <div v-for="order in data.recentRepairs" :key="order.id" class="repair-item">
            <div class="repair-head">
              <strong>{{ order.roomNo }}</strong>
              <span class="tag" :class="statusTagClass(order.status)">{{ order.status }}</span>
            </div>
            <p>{{ order.content }}</p>
            <div class="repair-foot">
              <span>{{ order.category }} · {{ order.reporter }}</span>
              <span>{{ formatDateTime(order.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty">
          <div class="empty-icon"><AppIcon name="check" :size="24" /></div>
          暂无报修工单
        </div>
      </article>
    </section>
  </template>
</template>

<style scoped>
.error-card {
  padding: 22px;
}

.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 34px 40px;
  border-radius: 22px;
  color: #e8ecf8;
  background: linear-gradient(120deg, #1b2550 0%, #33357f 55%, #4f46e5 100%);
  box-shadow: 0 26px 50px -34px rgba(49, 46, 129, 0.9);
}

.hero-glow {
  position: absolute;
  width: 380px;
  height: 380px;
  right: -80px;
  top: -180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22), transparent 66%);
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: rgba(232, 236, 248, 0.85);
}

.hero-copy h2 {
  margin-top: 14px;
  font-size: 25px;
  font-weight: 700;
  color: #fff;
}

.hero-copy p {
  margin-top: 10px;
  max-width: 480px;
  font-size: 13.5px;
  line-height: 1.8;
  color: rgba(232, 236, 248, 0.72);
}

.hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.hero-chips span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12.5px;
  color: rgba(232, 236, 248, 0.9);
}

.hero-chips i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fbbf24;
}

.hero-chips span:last-child i {
  background: #7dd3fc;
}

.hero-ring {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 148px;
  height: 148px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(#a5b4fc var(--rate), rgba(255, 255, 255, 0.16) 0);
}

.hero-ring::after {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background: #2c2f74;
}

.hero-ring-inner {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-ring-inner strong {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1.1;
}

.hero-ring-inner strong i {
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  color: rgba(232, 236, 248, 0.7);
  margin-left: 1px;
}

.hero-ring-inner span {
  font-size: 12px;
  color: rgba(232, 236, 248, 0.6);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-top: 20px;
}

.stat-card {
  padding: 22px 24px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 46px -34px rgba(15, 23, 42, 0.55);
}

.stat-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
}

.tone-indigo {
  background: #eeefff;
  color: #4f46e5;
}

.tone-green {
  background: #ecfdf5;
  color: #059669;
}

.tone-amber {
  background: #fffbeb;
  color: #d97706;
}

.tone-red {
  background: #fef2f2;
  color: #dc2626;
}

.stat-label {
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}

.stat-value {
  margin-top: 16px;
  font-size: 32px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.stat-value small {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}

.stat-foot {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.dash-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.building-list {
  padding: 22px 24px 26px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.building-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.building-row strong {
  font-size: 14.5px;
  color: var(--ink);
  font-weight: 600;
}

.building-row span {
  font-size: 12.5px;
  color: var(--muted);
}

.building-row em {
  margin-left: auto;
  font-style: normal;
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
}

.track {
  margin-top: 9px;
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
  transition: width 0.5s ease;
}

.building-sub {
  margin-top: 7px;
  font-size: 11.5px;
  color: #9aa4b6;
}

.repair-list {
  padding: 8px 24px 12px;
}

.repair-item {
  padding: 14px 0 15px;
  border-bottom: 1px solid var(--line-soft);
}

.repair-item:last-child {
  border-bottom: none;
}

.repair-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.repair-head strong {
  font-size: 13.5px;
  color: var(--ink);
  font-weight: 600;
}

.repair-item p {
  margin-top: 6px;
  font-size: 13px;
  color: #52607a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repair-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 11.5px;
  color: #9aa4b6;
}

@media (max-width: 1180px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dash-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 28px;
  }

  .hero-ring {
    width: 118px;
    height: 118px;
  }

  .hero-ring-inner strong {
    font-size: 24px;
  }
}
</style>
