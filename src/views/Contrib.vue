<script setup>
import { computed, reactive, ref } from 'vue'
import { store } from '../store'
import { api } from '../api'
import DateInput from '../Components/DateInput.vue'
const today = new Date().toLocaleDateString('sv-SE')
const form = reactive({ entry_date: today, name: '', amount: null }), err = ref('')
// Hiển thị đúng kiểu bạn yêu cầu: 9,000,000 VNĐ
const vnd = n => Math.round(n || 0).toLocaleString('en-US') + ' VNĐ'

// Gộp các lần góp theo tên cổ đông (không phân biệt hoa thường); thứ tự theo lần góp đầu tiên
const holders = computed(() => {
  const m = new Map()
  for (const c of [...store.contribs].sort((a, b) => a.entry_date.localeCompare(b.entry_date))) {
    const k = c.name.trim().toLowerCase()
    const h = m.get(k) || { name: c.name.trim(), total: 0 }
    h.total += +c.amount || 0; m.set(k, h)
  }
  return [...m.values()]
})
const total = computed(() => holders.value.reduce((a, h) => a + h.total, 0))
const pct = h => total.value ? (h.total / total.value * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%' : '—'
const rows = computed(() => [...store.contribs].sort((a, b) => b.entry_date.localeCompare(a.entry_date)))

async function add() {
  err.value = ''
  if (!form.name.trim() || !form.entry_date || !(+form.amount > 0)) return err.value = 'Hãy nhập ngày, tên cổ đông và số tiền góp'
  try {
    store.contribs.push(await api('contribs', 'POST', { entry_date: form.entry_date, name: form.name.trim(), amount: +form.amount }))
    form.name = ''; form.amount = null
  } catch (e) { err.value = e.message }
}
const save = r => api(`contribs/${r.id}`, 'PUT', { entry_date: r.entry_date, name: r.name.trim(), amount: r.amount })
const setDate = (r, v) => { r.entry_date = v; save(r) }
async function del(r) { await api(`contribs/${r.id}`, 'DELETE'); store.contribs = store.contribs.filter(x => x.id !== r.id) }
</script>
<template>
  <h1>Góp vốn</h1>
  <p class="sub">Ghi tiền góp vốn của từng cổ đông. Một người góp nhiều lần thì số tiền được cộng dồn theo tên.</p>
  <div class="grid">
    <div class="card"><h2>Cổ đông</h2>
      <div class="row rowc"><DateInput v-model="form.entry_date" />
        <input v-model="form.name" list="holders" placeholder="Tên cổ đông" aria-label="Tên cổ đông" @keyup.enter="add">
        <NumInput v-model="form.amount" placeholder="Tiền góp vốn" @keyup.enter="add" /><span></span></div>
      <datalist id="holders"><option v-for="h in holders" :key="h.name" :value="h.name"></option></datalist>
      <p class="bad" v-if="err">{{ err }}</p>
      <p><button class="btn g" @click="add">Thêm khoản góp vốn</button></p>
      <p class="empty" v-if="!rows.length">Chưa có khoản góp vốn nào. Nhập tên cổ đông và số tiền ở trên.</p>
      <div class="row rowc lbl" v-else><span>Ngày góp</span><span>Cổ đông</span><span>Tiền góp vốn</span><span></span></div>
      <div class="row rowc" v-for="r in rows" :key="r.id">
        <DateInput :model-value="r.entry_date" @update:model-value="v => v && setDate(r, v)" />
        <input v-model="r.name" list="holders" aria-label="Tên cổ đông" @change="save(r)">
        <NumInput v-model="r.amount" aria-label="Tiền góp vốn" @change="save(r)" />
        <button class="x" aria-label="Xoá" @click="del(r)">×</button></div>
    </div>
    <aside class="card res">
      <div class="lbl">Vốn tổng</div>
      <div class="big">{{ vnd(total) }}</div>
      <table class="led" v-if="holders.length"><tbody>
        <tr v-for="h in holders" :key="h.name"><td>{{ h.name }} <span class="lbl">({{ pct(h) }})</span></td><td>{{ vnd(h.total) }}</td></tr>
      </tbody></table>
      <p class="empty" v-else>Chưa có cổ đông nào.</p>
    </aside>
  </div>
</template>
<style scoped>
.rowc{grid-template-columns:140px 1fr 160px 32px}
@media(max-width:700px){.rowc{grid-template-columns:1fr 1fr}}
</style>