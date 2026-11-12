const STORAGE_KEY = 'dorm_user'

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function setUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY)
}
