import { ref } from 'vue'
const KEY = 'concalab-theme'
let saved = null
try { saved = localStorage.getItem(KEY) } catch {}
export const dark = ref(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches)
export const applyTheme = () => { document.documentElement.dataset.theme = dark.value ? 'dark' : 'light' }
export function toggleTheme() {
  dark.value = !dark.value; applyTheme()
  try { localStorage.setItem(KEY, dark.value ? 'dark' : 'light') } catch {}
}