import { ref } from 'vue'

const toast = ref(null)
let timer = null

export function showToast(message, type = 'success') {
  toast.value = { message, type }
  clearTimeout(timer)
  timer = setTimeout(() => {
    toast.value = null
  }, 2400)
}

export function useToast() {
  return toast
}
