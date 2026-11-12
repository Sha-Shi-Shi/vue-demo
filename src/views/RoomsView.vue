<script setup>
import { computed, onMounted, ref } from 'vue'
import AppDialog from '@/components/AppDialog.vue'
import AppIcon from '@/components/AppIcon.vue'
import { roomApi } from '@/api'
import { showToast } from '@/utils/toast'

const rooms = ref([])
const loading = ref(true)
const error = ref('')
const keyword = ref('')
const buildingFilter = ref('')

const dialogVisible = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const form = ref({ building: '', roomNo: '', floor: 1, capacity: 4, gender: '男', note: '' })

const deleteTarget = ref(null)
const deleting = ref(false)

const buildings = computed(() => [...new Set(rooms.value.map((room) => room.building))].sort())

const filteredRooms = computed(() => {
  const kw = keyword.value.trim()
  return rooms.value.filter((room) => {
    if (buildingFilter.value && room.building !== buildingFilter.value) return false
    if (kw && !room.roomNo.includes(kw) && !room.building.includes(kw)) return false
    return true
  })
})

const summary = computed(() => ({
  rooms: rooms.value.length,
  beds: rooms.value.reduce((total, room) => total + room.capacity, 0),
  used: rooms.value.reduce((total, room) => total + room.used, 0),
}))

async function load() {
  loading.value = true
  error.value = ''
  try {
    rooms.value = await roomApi.list()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openCreate() {
  editingId.value = null
  formError.value = ''
  form.value = {
    building: buildings.value[0] || '1号楼',
    roomNo: '',
    floor: 1,
    capacity: 4,
    gender: '男',
    note: '',
  }
  dialogVisible.value = true
}

function openEdit(room) {
  editingId.value = room.id
  formError.value = ''
  form.value = {
    building: room.building,
    roomNo: room.roomNo,
    floor: room.floor,
    capacity: room.capacity,
    gender: room.gender,
    note: room.note || '',
  }
  dialogVisible.value = true
}

async function saveRoom() {
  if (saving.value) return
  formError.value = ''
  if (!form.value.building.trim() || !form.value.roomNo.trim()) {
    formError.value = '请填写楼栋和房间号'
    return
  }
  if (!form.value.floor || form.value.floor < 1) {
    formError.value = '楼层必须大于 0'
    return
  }
  const payload = {
    building: form.value.building.trim(),
    roomNo: form.value.roomNo.trim(),
    floor: Number(form.value.floor),
    capacity: Number(form.value.capacity),
    gender: form.value.gender,
    note: form.value.note.trim(),
  }
  saving.value = true
  try {
    if (editingId.value) {
      await roomApi.update(editingId.value, payload)
      showToast('房间信息已更新')
    } else {
      await roomApi.create(payload)
      showToast('房间创建成功')
    }
    dialogVisible.value = false
    await load()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function removeRoom() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  try {
    await roomApi.remove(deleteTarget.value.id)
    showToast('房间已删除')
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
    <div class="search-box">
      <AppIcon name="search" :size="17" />
      <input v-model="keyword" class="input" placeholder="搜索房间号或楼栋" />
    </div>
    <select v-model="buildingFilter" class="select filter-select">
      <option value="">全部楼栋</option>
      <option v-for="item in buildings" :key="item" :value="item">{{ item }}</option>
    </select>
    <div class="spacer"></div>
    <button class="btn btn-primary" type="button" @click="openCreate">
      <AppIcon name="plus" :size="17" />
      新增房间
    </button>
  </div>

  <div v-if="loading" class="card loading-block">
    <span class="spinner"></span>
    正在加载房间数据…
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
        <h2>房间列表</h2>
        <p>
          共 {{ summary.rooms }} 间宿舍 · {{ summary.beds }} 个床位 · 已入住
          {{ summary.used }} 人
        </p>
      </div>
      <span class="tag tag-indigo">筛选结果 {{ filteredRooms.length }} 间</span>
    </header>

    <div v-if="filteredRooms.length" class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>房间</th>
            <th>类型</th>
            <th>容量</th>
            <th>入住情况</th>
            <th>空余床位</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="room in filteredRooms" :key="room.id">
            <td>
              <div class="cell-strong">{{ room.building }} {{ room.roomNo }}</div>
              <div class="cell-sub">{{ room.floor }} 层{{ room.note ? ` · ${room.note}` : '' }}</div>
            </td>
            <td>
              <span class="tag tag-gray">{{ room.gender }}</span>
            </td>
            <td>{{ room.capacity }} 人</td>
            <td>
              <div class="used-cell">
                <span class="cell-strong">{{ room.used }} / {{ room.capacity }}</span>
                <span class="mini-track">
                  <i :style="{ width: `${Math.min((room.used / room.capacity) * 100, 100)}%` }"></i>
                </span>
              </div>
            </td>
            <td>{{ room.available }} 个</td>
            <td>
              <span class="tag" :class="room.status === '满员' ? 'tag-red' : 'tag-green'">
                {{ room.status }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="btn btn-soft btn-sm" type="button" @click="openEdit(room)">
                  <AppIcon name="edit" :size="14" />
                  编辑
                </button>
                <button class="btn btn-ghost btn-sm danger-text" type="button" @click="deleteTarget = room">
                  <AppIcon name="trash" :size="14" />
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty">
      <div class="empty-icon"><AppIcon name="building" :size="24" /></div>
      没有找到符合条件的房间
    </div>
  </div>

  <AppDialog
    :show="dialogVisible"
    :title="editingId ? '编辑房间' : '新增房间'"
    width="560px"
    @close="dialogVisible = false"
  >
    <form class="form-grid" @submit.prevent="saveRoom">
      <div class="field">
        <label for="room-building">宿舍楼栋</label>
        <input
          id="room-building"
          v-model="form.building"
          class="input"
          list="building-options"
          placeholder="如：1号楼"
        />
        <datalist id="building-options">
          <option v-for="item in buildings" :key="item" :value="item"></option>
        </datalist>
      </div>
      <div class="field">
        <label for="room-no">房间号</label>
        <input id="room-no" v-model="form.roomNo" class="input" placeholder="如：101" />
      </div>
      <div class="field">
        <label for="room-floor">所在楼层</label>
        <input id="room-floor" v-model.number="form.floor" class="input" type="number" min="1" max="20" />
      </div>
      <div class="field">
        <label for="room-capacity">房间容量（人）</label>
        <input id="room-capacity" v-model.number="form.capacity" class="input" type="number" min="1" max="10" />
      </div>
      <div class="field">
        <label for="room-gender">房间类型</label>
        <select id="room-gender" v-model="form.gender" class="select">
          <option value="男">男生宿舍</option>
          <option value="女">女生宿舍</option>
          <option value="混合">混合宿舍</option>
        </select>
      </div>
      <div class="field">
        <label for="room-note">备注</label>
        <input id="room-note" v-model="form.note" class="input" placeholder="选填，如：朝南 / 考研自习室" />
      </div>
      <div v-if="formError" class="form-error span-2">{{ formError }}</div>
    </form>

    <template #footer>
      <button class="btn btn-ghost" type="button" @click="dialogVisible = false">取消</button>
      <button class="btn btn-primary" type="button" :disabled="saving" @click="saveRoom">
        {{ saving ? '保存中…' : '保存房间' }}
      </button>
    </template>
  </AppDialog>

  <AppDialog :show="!!deleteTarget" title="删除房间" width="420px" @close="deleteTarget = null">
    <p class="confirm-text">
      确定要删除「{{ deleteTarget?.building }} {{ deleteTarget?.roomNo }}」吗？该操作不可恢复。
    </p>
    <template #footer>
      <button class="btn btn-ghost" type="button" @click="deleteTarget = null">取消</button>
      <button class="btn btn-danger" type="button" :disabled="deleting" @click="removeRoom">
        {{ deleting ? '删除中…' : '确认删除' }}
      </button>
    </template>
  </AppDialog>
</template>

<style scoped>
.error-card {
  padding: 22px;
}

.used-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 92px;
}

.mini-track {
  display: block;
  height: 6px;
  border-radius: 999px;
  background: #f1f3fa;
  overflow: hidden;
}

.mini-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
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
