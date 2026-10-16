import { reactive, watch } from 'vue'
import { api } from './api'
export const store = reactive({
  user: null, materials: [], machines: [], costs: [], products: [], sales: [], accessories: [], editing: null,
  set: { elec: 3500, wage: 30000, fail: 5, mode: 'markup', profit: 50, ovh: 0, units: 300, var_cost: 0, avg_price: 0, use_acc: true },
  calc: { acc: [], name: '', sku: '', machine: null, material: null, gram: 50, h: 2, min: 30, handle: 10, qty: 1, other: 0, fee: 0, fixed: 0 }
})
let ready = false, timer
export async function loadAll() {
  const [materials, machines, costs, products, sales, accessories, set] = await Promise.all([api('materials'), api('machines'), api('company-costs'), api('products'), api('sales'), api('accessories'), api('settings')])
  Object.assign(store, { materials, machines, costs, products, sales, accessories })
  Object.assign(store.set, set)
  store.calc.machine ||= machines[0]?.id; store.calc.material ||= materials[0]?.id
  ready = true
}
// Tự lưu cài đặt lên Supabase sau 0,6 giây kể từ lần sửa cuối
watch(() => store.set, () => {
  if (!ready) return
  clearTimeout(timer); timer = setTimeout(() => api('settings', 'PUT', store.set).catch(console.error), 600)
}, { deep: true })