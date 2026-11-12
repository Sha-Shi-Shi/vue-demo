export function formatDateTime(value) {
  if (!value) return '—'
  return String(value).replace('T', ' ').slice(0, 16)
}

export function formatDate(value) {
  if (!value) return '—'
  return String(value).slice(0, 10)
}

export function todayString() {
  const date = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function statusTagClass(status) {
  const map = {
    待处理: 'tag-amber',
    处理中: 'tag-blue',
    已完成: 'tag-green',
  }
  return map[status] || 'tag-gray'
}
