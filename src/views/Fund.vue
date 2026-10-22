<script setup>
import { computed, reactive, ref } from 'vue'
import { store } from '../store'
import { api } from '../api'
import { fmt, monthlyProfit } from '../util'
import DateInput from '../Components/DateInput.vue'
const today = new Date().toLocaleDateString('sv-SE')
const filter = ref('all'), err = ref('')
const form = reactive({ entry_date: today, name: '', amount: null })
const my = ym => `${+ym.slice(5, 7)}/${ym.slice(0, 4)}`

// Khoản Thu của quỹ = lợi nhuận ròng từng tháng, tính trực tiếp từ doanh thu và chi phí
// nên khi số liệu tháng nào đổi thì quỹ tự đổi theo (không lưu bản sao nào).
const auto = computed(() => monthlyProfit(store).map(m => ({ ...m, id: 'auto-' + m.ym, auto: true, key: m.ym + '-99' })))
const spends = computed(() => store.fund.map(f => ({ ...f, key: f.entry_date })))
const rows = computed(() => {
  const list = filter.value === 'thu' ? auto.value : filter.value === 'chi' ? spends.value : [...auto.value, ...spends.value]
  return [...list].sort((a, b) => b.key.localeCompare(a.key))
})
const thu = computed(() => auto.value.reduce((a, m) => a + m.profit, 0))
const chi = computed(() => store.fund.reduce((a, f) => a + (+f.amount || 0), 0))
const balance = computed(() => thu.value - chi.value)

async function add() {
  err.value = ''
  if (!form.name.trim() || !form.entry_date || !(+form.amount > 0)) return err.value = 'Hãy nhập ngày, nội dung và số tiền'
  try {
    store.fund.push(await api('fund', 'POST', { entry_date: form.entry_date, name: form.name.trim(), amount: +form.amount }))
    form.name = ''; form.amount = null
  } catch (e) { err.value = e.message }
}
const save = r => api(`fund/${r.id}`, 'PUT', { entry_date: r.entry_date, name: r.name, amount: r.amount })
const setDate = (r, v) => { r.entry_date = v; save(r) }
async function del(r) { await api(`fund/${r.id}`, 'DELETE'); store.fund = store.fund.filter(x => x.id !== r.id) }
</script>
<template>
  <h1>Quỹ công ty</h1>
  <p class="sub">Lợi nhuận ròng của từng tháng tự cộng vào quỹ. Bạn chỉ cần nhập các khoản Chi.</p>
  <div class="grid">
    <div>
      <div class="card"><h2>Thêm khoản chi</h2>
        <div class="row row4"><DateInput v-model="form.entry_date" /><input v-model="form.name" placeholder="Nội dung (chia lợi nhuận, mua máy, quỹ dự phòng...)" @keyup.enter="add"><NumInput v-model="form.amount" placeholder="Số tiền" @keyup.enter="add" /><span></span></div>
        <p class="bad" v-if="err">{{ err }}</p>
        <p><button class="btn g" @click="add">Thêm khoản chi</button></p></div>
      <div class="card"><h2>Sổ quỹ</h2>
        <div class="seg" style="margin-bottom:12px"><button v-for="f in [['all', 'Tất cả'], ['thu', 'Thu'], ['chi', 'Chi']]" :key="f[0]" :class="{ on: filter === f[0] }" @click="filter = f[0]">{{ f[1] }}</button></div>
        <p class="empty" v-if="!rows.length">Chưa có khoản nào. Khi có doanh thu hoặc chi phí, lợi nhuận từng tháng sẽ tự hiện ở đây.</p>
        <div class="row cap" v-for="r in rows" :key="r.id">
          <template v-if="r.auto">
            <span :class="r.profit >= 0 ? 'ok' : 'bad'"><b>Thu</b></span><span>{{ my(r.ym) }}</span>
            <span>{{ r.profit >= 0 ? 'Lợi nhuận' : 'Lỗ' }} tháng {{ my(r.ym) }}
              <span class="lbl sub2">Doanh thu {{ fmt(r.rev) }} − hoàn vốn {{ fmt(r.cogs) }} − chi phí {{ fmt(r.cost) }}</span></span>
            <span class="n" :class="r.profit >= 0 ? 'ok' : 'bad'">{{ fmt(r.profit) }}</span><span></span>
          </template>
          <template v-else>
            <span class="bad"><b>Chi</b></span>
            <DateInput :model-value="r.entry_date" @update:model-value="v => v && setDate(r, v)" /><input v-model="r.name" aria-label="Nội dung" @change="save(r)">
            <NumInput v-model="r.amount" aria-label="Số tiền" @change="save(r)" /><button class="x" aria-label="Xoá" @click="del(r)">×</button>
          </template>
        </div></div>
    </div>
    <aside class="card res">
      <div class="lbl">Quỹ công ty hiện có</div>
      <div class="big" :class="balance >= 0 ? 'ok' : 'bad'">{{ fmt(balance) }}</div>
      <table class="led"><tbody>
        <tr><td>Lợi nhuận đã cộng vào quỹ</td><td :class="thu >= 0 ? 'ok' : 'bad'">{{ fmt(thu) }}</td></tr>
        <tr><td>Tổng chi</td><td>{{ fmt(chi) }}</td></tr>
        <tr class="t"><td>Còn lại</td><td :class="balance >= 0 ? 'ok' : 'bad'">{{ fmt(balance) }}</td></tr>
      </tbody></table>
      <p class="note">Lợi nhuận lấy từ <router-link to="/company">Chi phí công ty</router-link>. Tháng lỗ sẽ trừ vào quỹ.</p>
    </aside>
  </div>
</template>
<style scoped>
.cap{grid-template-columns:70px 130px 1fr 130px 32px}
.cap .n{text-align:right;font-weight:600}
.sub2{display:block;margin-top:2px}
@media(max-width:700px){.cap{grid-template-columns:1fr 1fr}}
</style>