<script setup>
import { computed, reactive, ref } from 'vue'
import { store } from '../store'
import { api } from '../api'
import { fmt } from '../util'
import DateInput from '../Components/DateInput.vue'
const today = new Date().toLocaleDateString('sv-SE')
const filter = ref('all'), err = ref('')
const form = reactive({ kind: 'thu', entry_date: today, name: '', amount: null })
const dmy = d => d.split('-').reverse().join('/')

// Hoàn vốn nhập ở mục Doanh thu tự động là khoản Thu (không lưu trùng, luôn khớp với doanh thu)
const auto = computed(() => store.sales.filter(s => +s.cogs > 0).map(s => ({
  id: 'auto-' + s.id, kind: 'thu', entry_date: s.sold_on, amount: +s.cogs, auto: true,
  name: `Hoàn vốn doanh thu tháng ${+s.sold_on.slice(5, 7)}/${s.sold_on.slice(0, 4)}`
})))
const all = computed(() => [...store.capital, ...auto.value].sort((a, b) => b.entry_date.localeCompare(a.entry_date)))
const rows = computed(() => all.value.filter(r => filter.value === 'all' || r.kind === filter.value))
const sum = k => all.value.filter(r => r.kind === k).reduce((a, r) => a + (+r.amount || 0), 0)
const thu = computed(() => sum('thu')), chi = computed(() => sum('chi')), balance = computed(() => thu.value - chi.value)
const hoan = computed(() => auto.value.reduce((a, r) => a + r.amount, 0))

async function add() {
  err.value = ''
  if (!form.name.trim() || !form.entry_date || !(+form.amount > 0)) return err.value = 'Hãy nhập ngày, nội dung và số tiền'
  try {
    store.capital.push(await api('capital', 'POST', { kind: form.kind, entry_date: form.entry_date, name: form.name.trim(), amount: +form.amount }))
    form.name = ''; form.amount = null
  } catch (e) { err.value = e.message }
}
const setDate = (r, v) => { r.entry_date = v; save(r) }
const save = r => api(`capital/${r.id}`, 'PUT', { kind: r.kind, entry_date: r.entry_date, name: r.name, amount: r.amount })
async function del(r) { await api(`capital/${r.id}`, 'DELETE'); store.capital = store.capital.filter(x => x.id !== r.id) }
</script>
<template>
  <h1>Vốn công ty</h1>
  <p class="sub">Theo dõi tiền vốn của công ty qua các khoản Thu và Chi. Hoàn vốn nhập ở mục Doanh thu sẽ tự cộng vào khoản Thu.</p>
  <div class="grid">
    <div>
      <div class="card"><h2>Thêm khoản</h2>
        <div class="sw lt kind"><button :class="{ on: form.kind === 'thu' }" @click="form.kind = 'thu'">Thu</button><button :class="{ on: form.kind === 'chi' }" @click="form.kind = 'chi'">Chi</button></div>
        <div class="row row4"><DateInput v-model="form.entry_date" /><input v-model="form.name" placeholder="Nội dung (góp vốn, mua máy, rút vốn...)" @keyup.enter="add"><NumInput v-model="form.amount" placeholder="Số tiền" @keyup.enter="add" /><span></span></div>
        <p class="bad" v-if="err">{{ err }}</p>
        <p><button class="btn g" @click="add">Thêm khoản {{ form.kind === 'thu' ? 'thu' : 'chi' }}</button></p></div>
      <div class="card"><h2>Sổ vốn</h2>
        <div class="seg" style="margin-bottom:12px"><button v-for="f in [['all', 'Tất cả'], ['thu', 'Thu'], ['chi', 'Chi']]" :key="f[0]" :class="{ on: filter === f[0] }" @click="filter = f[0]">{{ f[1] }}</button></div>
        <p class="empty" v-if="!rows.length">Chưa có khoản nào.</p>
        <div class="row cap" v-for="r in rows" :key="r.id">
          <template v-if="r.auto">
            <span :class="r.kind === 'thu' ? 'ok' : 'bad'"><b>Thu</b></span><span>{{ dmy(r.entry_date) }}</span>
            <span>{{ r.name }} <span class="lbl">(tự động từ Doanh thu)</span></span><span class="n">{{ fmt(r.amount) }}</span><span></span>
          </template>
          <template v-else>
            <select v-model="r.kind" aria-label="Loại" @change="save(r)"><option value="thu">Thu</option><option value="chi">Chi</option></select>
            <DateInput :model-value="r.entry_date" @update:model-value="v => v && setDate(r, v)" /><input v-model="r.name" aria-label="Nội dung" @change="save(r)">
            <NumInput v-model="r.amount" aria-label="Số tiền" @change="save(r)" /><button class="x" aria-label="Xoá" @click="del(r)">×</button>
          </template>
        </div></div>
    </div>
    <aside class="card res">
      <div class="lbl">Vốn công ty hiện có</div>
      <div class="big" :class="balance >= 0 ? 'ok' : 'bad'">{{ fmt(balance) }}</div>
      <table class="led"><tbody>
        <tr><td>Tổng thu</td><td>{{ fmt(thu) }}</td></tr>
        <tr><td>Trong đó hoàn vốn tự động</td><td>{{ fmt(hoan) }}</td></tr>
        <tr><td>Tổng chi</td><td>{{ fmt(chi) }}</td></tr>
        <tr class="t"><td>Còn lại</td><td :class="balance >= 0 ? 'ok' : 'bad'">{{ fmt(balance) }}</td></tr>
      </tbody></table>
      <p class="note">Hoàn vốn nhập ở <router-link to="/company">Chi phí công ty</router-link>, tab Lợi nhuận, mục Doanh thu theo tháng.</p>
    </aside>
  </div>
</template>
<style scoped>
.cap{grid-template-columns:70px 130px 1fr 130px 32px}
.cap .n{text-align:right}
.kind{width:fit-content;margin-bottom:12px}
@media(max-width:700px){.cap{grid-template-columns:1fr 1fr}}
</style>