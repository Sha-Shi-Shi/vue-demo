<script setup>
import { computed, onMounted, ref } from 'vue'
import AppDialog from '@/components/AppDialog.vue'
import AppIcon from '@/components/AppIcon.vue'
import { repairApi, roomApi } from '@/api'
import { getUser } from '@/utils/auth'
import { formatDateTime, statusTagClass } from '@/utils/format'
import { showToast } from '@/utils/toast'

const user = getUser()
const repairs = ref([])
const rooms = ref([])
const loading = ref(true)
const error = ref('')
const activeStatus = ref('全部')

const dialogVisible = ref(false)
const saving = ref(false)
const formError = ref('')
const form = ref({ roomNo: '', category: '水电', reporter: user?.username || '', content: '' })

const deleteTarget = ref(null)
const deleting = ref(false)
const processingId = ref(null)

const statuses = ['待处理', '处理中', '已完成']

const tabs = computed(() => [
  { label: '全部', count: repairs.value.length },
  ...statuses.map((status) => ({
    label: status,
    count: repairs.value.filter((order) => order.status === status).length,
  })),
])

const filteredRepairs = computed(() => {
  if (activeStatus.value === '全部') return repairs.value
  return repairs.value.filter((order) => order.status === activeStatus.value)
})

const sortedRooms = computed(() =>
  [...rooms.value].sort(
    (a, b) => a.building.localeCompare(b.building) || a.roomNo.localeCompare(b.roomNo),
  ),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [orders, roomList] = await Promise.all([repairApi.list(), roomApi.list()])
    repairs.value = orders
    rooms.value = roomList
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openCreate() {
  formError.value = ''
  form.value = {
    roomNo: '',
    category: '水电',
    reporter: user?.username || '',
    content: '',
  }
  dialogVisible.value = true
}

async function createOrder() {
  if (saving.value) return
  formError.value = ''
  if (!form.value.roomNo) {
    formError.value = '请选择报修房间'
    return
  }
  if (!form.value.content.trim()) {
    formError.value = '请填写报修内容'
    return
  }
  saving.value = true
  try {
    await repairApi.create({
      roomNo: form.value.roomNo,
      category: form.value.category,
      reporter: form.value.reporter.trim(),
      content: form.value.content.trim(),
    })
    showToast('报修提交成功')
    dialogVisible.value = false
    await load()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function updateStatus(order, status) {
  if (processingId.value) return
  processingId.value = order.id
  try {
    await repairApi.updateStatus(order.id, { status, handler: user?.username || '宿舍管理员' })
    showToast(status === '已完成' ? '报修已完成' : '报修已开始处理')
    await load()
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    processingId.value = null
  }
}

async function removeOrder() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  try {
    await repairApi.remove(deleteTarget.value.id)
    showToast('报修单已删除')
    deleteTarget.value = null
    await load()
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="toolbar">
    <div class="segmented">
      <button
        v-for="tab in tabs"
        :key="tab.label"
        type="button"
        class="segment"
        :class="{ active: activeStatus === tab.label }"
        @click="activeStatus = tab.label"
      >
        {{ tab.label }}
        <span>{{ tab.count }}</span>
      </button>
    </div>
    <div class="spacer"></div>
    <button class="btn btn-primary" type="button" @click="openCreate">
      <AppIcon name="plus" :size="17" />
      新增报修
    </button>
  </div>

  <div v-if="loading" class="card loading-block">
    <span class="spinner"></span>
    正在加载报修工单…
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

  <div v-else class="card">
    <header class="card-head">
      <div>
        <h2>报修工单</h2>
        <p>共 {{ repairs.length }} 条记录，待处理 {{ tabs[1].count }} 条</p>
      </div>
      <span class="tag" :class="activeStatus === '全部' ? 'tag-indigo' : statusTagClass(activeStatus)">
        {{ activeStatus }}
      </span>
    </header>

    <div v-if="filteredRepairs.length" class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>报修房间</th>
            <th>类别</th>
            <th>报修内容</th>
            <th>报修人</th>
            <th>状态</th>
            <th>提交时间</th>
            <th>处理人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredRepairs" :key="order.id">
            <td>
              <div class="cell-strong">{{ order.roomNo }}</div>
              <div class="cell-sub">#{{ order.id }}</div>
            </td>
            <td>
              <span class="tag tag-gray">{{ order.category }}</span>
            </td>
            <td>
              <div class="content-cell" :title="order.content">{{ order.content }}</div>
            </td>
            <td>{{ order.reporter || '匿名' }}</td>
            <td>
              <span class="tag" :class="statusTagClass(order.status)">{{ order.status }}</span>
            </td>
            <td>{{ formatDateTime(order.createdAt) }}</td>
            <td>{{ order.handler || '—' }}</td>
            <td>
              <div class="row-actions">
                <button
                  v-if="order.status === '待处理'"
                  class="btn btn-soft btn-sm"
                  type="button"
                  :disabled="processingId === order.id"
                  @click="updateStatus(order, '处理中')"
                >
                  开始处理
                </button>
                <button
                  v-else-if="order.status === '处理中'"
                  class="btn btn-soft btn-sm"
                  type="button"
                  :disabled="processingId === order.id"
                  @click="updateStatus(order, '已完成')"
                >
                  <AppIcon name="check" :size="14" />
                  标记完成
                </button>
                <button
                  class="btn btn-ghost btn-sm danger-text"
                  type="button"
                  @click="deleteTarget = order"
                >
                  <AppIcon name="trash" :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty">
      <div class="empty-icon"><AppIcon name="wrench" :size="24" /></div>
      当前状态下暂无报修工单
    </div>
  </div>

  <AppDialog :show="dialogVisible" title="新增报修" width="560px" @close="dialogVisible = false">
    <form class="form-grid" @submit.prevent="createOrder">
      <div class="field span-2">
        <label for="repair-room">报修房间</label>
        <select id="repair-room" v-model="form.roomNo" class="select">
          <option value="" disabled>请选择报修房间</option>
          <option v-for="room in sortedRooms" :key="room.id" :value="`${room.building} ${room.roomNo}`">
            {{ room.building }} {{ room.roomNo }}（{{ room.gender }}生宿舍）
          </option>
        </select>
        <span v-if="!rooms.length" class="hint">暂无房间数据，请先在「宿舍房间」中创建房间</span>
      </div>
      <div class="field">
        <label for="repair-category">报修类别</label>
        <select id="repair-category" v-model="form.category" class="select">
          <option value="水电">水电</option>
          <option value="网络">网络</option>
          <option value="家具">家具</option>
          <option value="其他">其他</option>
        </select>
      </div>
      <div class="field">
        <label for="repair-reporter">报修人</label>
        <input id="repair-reporter" v-model="form.reporter" class="input" placeholder="选填，默认匿名" />
      </div>
      <div class="field span-2">
        <label for="repair-content">报修内容</label>
        <textarea
          id="repair-content"
          v-model="form.content"
          class="textarea"
          placeholder="请描述故障情况，如：卫生间水龙头漏水，地面湿滑"
        ></textarea>
      </div>
      <div v-if="formError" class="form-error span-2">{{ formError }}</div>
    </form>

    <template #footer>
      <button class="btn btn-ghost" type="button" @click="dialogVisible = false">取消</button>
      <button class="btn btn-primary" type="button" :disabled="saving" @click="createOrder">
        {{ saving ? '提交中…' : '提交报修' }}
      </button>
    </template>
  </AppDialog>

  <AppDialog :show="!!deleteTarget" title="删除报修单" width="420px" @close="deleteTarget = null">
    <p class="confirm-text">
      确定要删除「{{ deleteTarget?.roomNo }} · {{ deleteTarget?.category }}」这条报修记录吗？
    </p>
    <template #footer>
      <button class="btn btn-ghost" type="button" @click="deleteTarget = null">取消</button>
      <button class="btn btn-danger" type="button" :disabled="deleting" @click="removeOrder">
        {{ deleting ? '删除中…' : '确认删除' }}
      </button>
    </template>
  </AppDialog>
</template>

<style scoped>
.error-card {
  padding: 22px;
}

.segmented {
  display: inline-flex;
  padding: 4px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--line);
  gap: 4px;
}

.segment {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}

.segment span {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #f1f3fa;
  font-size: 11px;
  color: #64748b;
}

.segment:hover {
  background: #f8fafc;
  color: var(--ink);
}

.segment.active {
  background: var(--primary-soft);
  color: var(--primary);
}

.segment.active span {
  background: #fff;
  color: var(--primary);
}

.content-cell {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.danger-text {
  color: var(--danger);
}

.danger-text:hover {
  color: var(--danger);
  background: #fef2f2;
  border-color: #fecaca;
}

.form-error {
  padding: 10px 14px;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 13px;
}

.confirm-text {
  font-size: 14px;
  color: #475569;
  line-height: 1.8;
}
</style>
