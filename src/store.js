import { reactive, watch, nextTick } from 'vue'
import { api } from './api'
// Biểu mẫu tính giá trống: dùng cho lúc mở app và khi bấm "Tạo sản phẩm mới"
export const blankCalc = () => ({ acc: [], name: '', sku: '', machine: null, mats: [{ id: null, gram: 0 }], h: 0, min: 0, handle: 0, qty: 1, other: 0, fee: 0, fixed: 0 })
export const store = reactive({
  user: null, loading: false, loadError: '', materials: [], machines: [], costs: [], products: [], sales: [], accessories: [], capital: [], fund: [], editing: null,
  set: { elec: 3500, wage: 30000, fail: 5, mode: 'markup', profit: 50, ovh: 0, units: 300, var_cost: 0, avg_price: 0, use_acc: true },
  calc: blankCalc()
})
// Xoá sạch biểu mẫu, chọn lại máy và nhựa đầu tiên trong thư viện, thoát chế độ sửa sản phẩm
export function resetCalc() {
  Object.assign(store.calc, blankCalc())
  store.calc.machine = store.machines[0]?.id ?? null
  store.calc.mats[0].id = store.materials[0]?.id ?? null
  store.editing = null
}
let ready = false, timer
export async function loadAll() {
  store.loading = true; store.loadError = ''; ready = false
  try {
    const d = await api('bootstrap') // một lần gọi duy nhất thay cho tám lần
    Object.assign(store, { materials: d.materials, machines: d.machines, costs: d.costs, products: d.products, sales: d.sales, accessories: d.accessories, capital: d.capital, fund: d.fund })
    Object.assign(store.set, d.settings)
    store.calc.machine ||= d.machines[0]?.id; if (!store.calc.mats[0]?.id) store.calc.mats[0].id = d.materials[0]?.id
    await nextTick() // để lần gán dữ liệu vừa tải không bị coi là người dùng vừa sửa cài đặt
    ready = true
  } catch (e) { store.loadError = e.message || 'Lỗi không xác định'; console.error(e) }
  finally { store.loading = false }
}
// Tự lưu cài đặt lên Supabase sau 0,6 giây kể từ lần sửa cuối
watch(() => store.set, () => {
  if (!ready) return
  clearTimeout(timer); timer = setTimeout(() => api('settings', 'PUT', store.set).catch(console.error), 600)
}, { deep: true })