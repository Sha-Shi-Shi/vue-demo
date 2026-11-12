<script setup>
import { computed, onMounted, ref } from 'vue'
import AppDialog from '@/components/AppDialog.vue'
import AppIcon from '@/components/AppIcon.vue'
import { roomApi, studentApi } from '@/api'
import { formatDate, todayString } from '@/utils/format'
import { showToast } from '@/utils/toast'

const students = ref([])
const rooms = ref([])
const loading = ref(true)
const error = ref('')
const keyword = ref('')

const dialogVisible = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')
const form = ref(emptyForm())

const deleteTarget = ref(null)
const deleting = ref(false)

function emptyForm() {
  return {
    studentNo: '',
    name: '',
    gender: '男',
    className: '',
    phone: '',
    roomId: null,
    bedNo: '',
    checkInDate: todayString(),
  }
}

const sortedRooms = computed(() =>
  [...rooms.value].sort(
    (a, b) => a.building.localeCompare(b.building) || a.roomNo.localeCompare(b.roomNo),
  ),
)

const filteredStudents = computed(() => {
  const kw = keyword.value.trim()
  if (!kw) return students.value
  return students.value.filter((student) => {
    const fields = [
      student.studentNo,
      student.name,
      student.className,
      student.phone,
      student.building,
      student.roomNo,
    ]
    return fields.some((field) => String(field || '').includes(kw))
  })
})

const summary = computed(() => ({
  total: students.value.length,
  male: students.value.filter((student) => student.gender === '男').length,
  female: students.value.filter((student) => student.gender === '女').length,
  unassigned: students.value.filter((student) => !student.roomId).length,
}))

const selectedRoom = computed(() => rooms.value.find((room) => room.id === form.value.roomId) || null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [studentList, roomList] = await Promise.all([studentApi.list(), roomApi.list()])
    students.value = studentList
    rooms.value = roomList
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
  form.value = emptyForm()
  dialogVisible.value = true
}

function openEdit(student) {
  editingId.value = student.id
  formError.value = ''
  form.value = {
    studentNo: student.studentNo,
    name: student.name,
    gender: student.gender || '男',
    className: student.className || '',
    phone: student.phone || '',
    roomId: student.roomId,
    bedNo: student.bedNo ?? '',
    checkInDate: student.checkInDate ? String(student.checkInDate).slice(0, 10) : todayString(),
  }
  dialogVisible.value = true
}

function onRoomChange() {
  form.value.bedNo = ''
}

function isRoomDisabled(room) {
  if (editingId.value && room.id === form.value.roomId) return false
  return room.available === 0
}

async function saveStudent() {
  if (saving.value) return
  formError.value = ''
  if (!form.value.studentNo.trim() || !form.value.name.trim()) {
    formError.value = '请填写学号和姓名'
    return
  }
  if (!form.value.roomId) {
    formError.value = '请选择入住房间'
    return
  }
  const payload = {
    studentNo: form.value.studentNo.trim(),
    name: form.value.name.trim(),
    gender: form.value.gender,
    className: form.value.className.trim(),
    phone: form.value.phone.trim(),
    roomId: Number(form.value.roomId),
    bedNo: form.value.bedNo === '' ? null : Number(form.value.bedNo),
    checkInDate: form.value.checkInDate || null,
  }
  saving.value = true
  try {
    if (editingId.value) {
      await studentApi.update(editingId.value, payload)
      showToast('学生信息已更新')
    } else {
      await studentApi.create(payload)
      showToast('学生入住登记成功')
    }
    dialogVisible.value = false
    await load()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function removeStudent() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  try {
    await studentApi.remove(deleteTarget.value.id)
    showToast('学生记录已删除')
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
      <input v-model="keyword" class="input" placeholder="搜索姓名、学号、班级或房间" />
    </div>
    <div class="spacer"></div>
    <button class="btn btn-primary" type="button" @click="openCreate">
      <AppIcon name="plus" :size="17" />
      学生入住登记
    </button>
  </div>

  <div v-if="loading" class="card loading-block">
    <span class="spinner"></span>
    正在加载学生数据…
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
        <h2>入住学生</h2>
        <p>
          共 {{ summary.total }} 名学生 · 男生 {{ summary.male }} 人 · 女生
          {{ summary.female }} 人 · 待分配 {{ summary.unassigned }} 人
        </p>
      </div>
      <span class="tag tag-indigo">筛选结果 {{ filteredStudents.length }} 人</span>
    </header>

    <div v-if="filteredStudents.length" class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>学生</th>
            <th>性别</th>
            <th>班级</th>
            <th>联系电话</th>
            <th>宿舍</th>
            <th>入住日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in filteredStudents" :key="student.id">
            <td>
              <div class="cell-strong">{{ student.name }}</div>
              <div class="cell-sub">{{ student.studentNo }}</div>
            </td>
            <td>
              <span class="tag" :class="student.gender === '女' ? 'tag-indigo' : 'tag-blue'">
                {{ student.gender || '未知' }}
              </span>
            </td>
            <td>{{ student.className || '—' }}</td>
            <td>{{ student.phone || '—' }}</td>
            <td>
              <template v-if="student.roomId">
                <div class="cell-strong">{{ student.building }} {{ student.roomNo }}</div>
                <div class="cell-sub">{{ student.bedNo }} 号床位</div>
              </template>
              <span v-else class="tag tag-amber">待分配</span>
            </td>
            <td>{{ formatDate(student.checkInDate) }}</td>
            <td>
              <div class="row-actions">
                <button class="btn btn-soft btn-sm" type="button" @click="openEdit(student)">
                  <AppIcon name="edit" :size="14" />
                  编辑
                </button>
                <button class="btn btn-ghost btn-sm danger-text" type="button" @click="deleteTarget = student">
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
      <div class="empty-icon"><AppIcon name="users" :size="24" /></div>
      暂无学生入住记录
    </div>
  </div>

  <AppDialog
    :show="dialogVisible"
    :title="editingId ? '编辑学生信息' : '学生入住登记'"
    width="620px"
    @close="dialogVisible = false"
  >
    <div v-if="!rooms.length" class="alert form-alert">
      还没有可用的宿舍房间，请先到「宿舍房间」页面新增房间。
    </div>

    <form class="form-grid" @submit.prevent="saveStudent">
      <div class="field">
        <label for="student-no">学号</label>
        <input id="student-no" v-model="form.studentNo" class="input" placeholder="如：2023001" />
      </div>
      <div class="field">
        <label for="student-name">姓名</label>
        <input id="student-name" v-model="form.name" class="input" placeholder="请输入学生姓名" />
      </div>
      <div class="field">
        <label for="student-gender">性别</label>
        <select id="student-gender" v-model="form.gender" class="select">
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
      </div>
      <div class="field">
        <label for="student-class">班级</label>
        <input id="student-class" v-model="form.className" class="input" placeholder="如：计算机2301" />
      </div>
      <div class="field">
        <label for="student-phone">联系电话</label>
        <input id="student-phone" v-model="form.phone" class="input" placeholder="选填" />
      </div>
      <div class="field">
        <label for="student-date">入住日期</label>
        <input id="student-date" v-model="form.checkInDate" class="input" type="date" />
      </div>
      <div class="field span-2">
        <label for="student-room">入住房间</label>
        <select id="student-room" v-model="form.roomId" class="select" @change="onRoomChange">
          <option :value="null" disabled>请选择房间</option>
          <option
            v-for="room in sortedRooms"
            :key="room.id"
            :value="room.id"
            :disabled="isRoomDisabled(room)"
          >
            {{ room.building }} {{ room.roomNo }}（{{ room.gender }}生 · 空余
            {{ room.available }} / {{ room.capacity }}）
          </option>
        </select>
        <span v-if="selectedRoom" class="hint">
          该房间已入住 {{ selectedRoom.used }} 人，容量 {{ selectedRoom.capacity }} 人
        </span>
        <span v-else class="hint">满员房间不可选择</span>
      </div>
      <div class="field">
        <label for="student-bed">床位号</label>
        <input
          id="student-bed"
          v-model="form.bedNo"
          class="input"
          type="number"
          min="1"
          placeholder="留空则自动分配"
        />
      </div>
      <div v-if="formError" class="form-error span-2">{{ formError }}</div>
    </form>

    <template #footer>
      <button class="btn btn-ghost" type="button" @click="dialogVisible = false">取消</button>
      <button class="btn btn-primary" type="button" :disabled="saving" @click="saveStudent">
        {{ saving ? '保存中…' : '保存' }}
      </button>
    </template>
  </AppDialog>

  <AppDialog :show="!!deleteTarget" title="删除学生记录" width="420px" @close="deleteTarget = null">
    <p class="confirm-text">
      确定要删除「{{ deleteTarget?.name }}（{{ deleteTarget?.studentNo }}）」的入住记录吗？删除后床位将被释放。
    </p>
    <template #footer>
      <button class="btn btn-ghost" type="button" @click="deleteTarget = null">取消</button>
      <button class="btn btn-danger" type="button" :disabled="deleting" @click="removeStudent">
        {{ deleting ? '删除中…' : '确认删除' }}
      </button>
    </template>
  </AppDialog>
</template>

<style scoped>
.error-card {
  padding: 22px;
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

.form-alert {
  margin-bottom: 18px;
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
  justify-content: flex-start;
}

.confirm-text {
  font-size: 14px;
  color: #475569;
  line-height: 1.8;
}
</style>
