import { reactive, watch } from 'vue'
import { api } from './api'
export const store = reactive({
  user: null, loading: false, loadError: '', materials: [], machines: [], costs: [], products: [], sales: [], accessories: [], capital: [], editing: null,
  set: { elec: 3500, wage: 30000, fail: 5, mode: 'markup', profit: 50, ovh: 0, units: 300, var_cost: 0, avg_price: 0, use_acc: true },
  calc: { acc: [], name: '', sku: '', machine: null, material: null, gram: 50, h: 2, min: 30, handle: 10, qty: 1, other: 0, fee: 0, fixed: 0 }
})
let ready = false, timer
export async function loadAll() {
  store.loading = true; store.loadError = ''
  try {
    const d = await api('bootstrap') // một lần gọi duy nhất thay cho tám lần
    Object.assign(store, { materials: d.materials, machines: d.machines, costs: d.costs, products: d.products, sales: d.sales, accessories: d.accessories, capital: d.capital })
    Object.assign(store.set, d.settings)
    store.calc.machine ||= d.machines[0]?.id; store.calc.material ||= d.materials[0]?.id
    ready = true
  } catch (e) { store.loadError = e.message || 'Lỗi không xác định'; console.error(e) }
  finally { store.loading = false }
}
// Tự lưu cài đặt lên Supabase sau 0,6 giây kể từ lần sửa cuối
watch(() => store.set, () => {
  if (!ready) return
  clearTimeout(timer); timer = setTimeout(() => api('settings', 'PUT', store.set).catch(console.error), 600)
}, { deep: true })