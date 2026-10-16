<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../store'
import { api } from '../api'
import { compute, fmt } from '../util'
const router = useRouter(), s = store.set, now = new Date()
const curSel = v => v === 'month' ? now.getMonth() + 1 : Math.ceil((now.getMonth() + 1) / 3)
const view = ref('month'), year = ref(now.getFullYear()), sel = ref(curSel('month'))
const form = reactive({ spent_on: now.toLocaleDateString('sv-SE'), name: '', amount: null }), err = ref('')
const ym = c => [+c.spent_on.slice(0, 4), +c.spent_on.slice(5, 7)]
const MONTHS = { month: 1, quarter: 3, year: 12 }
const setView = v => { view.value = v; sel.value = curSel(v) }
function match(c) {
  const [y, m] = ym(c)
  if (view.value === 'year') return y === year.value
  return y === year.value && (view.value === 'month' ? m === sel.value : Math.ceil(m / 3) === sel.value)
}
const sum = f => store.costs.filter(f).reduce((a, c) => a + (+c.amount || 0), 0)
const stats = computed(() => {
  let rows
  if (view.value === 'month') rows = Array.from({ length: 12 }, (_, i) => ({ key: i + 1, label: `Tháng ${i + 1}`, total: sum(c => ym(c)[0] === year.value && ym(c)[1] === i + 1) }))
  else if (view.value === 'quarter') rows = [1, 2, 3, 4].map(q => ({ key: q, label: `Quý ${q}`, total: sum(c => ym(c)[0] === year.value && Math.ceil(ym(c)[1] / 3) === q) }))
  else rows = [...new Set([...store.costs.map(c => ym(c)[0]), now.getFullYear()])].sort().map(y => ({ key: y, label: `Năm ${y}`, total: sum(c => ym(c)[0] === y) }))
  const max = Math.max(1, ...rows.map(r => r.total))
  return rows.map(r => ({ ...r, pct: r.total / max * 100 }))
})
const pick = r => view.value === 'year' ? year.value = r.key : sel.value = r.key
const isSel = r => r.key === (view.value === 'year' ? year.value : sel.value)
const shown = computed(() => store.costs.filter(match).sort((a, b) => b.spent_on.localeCompare(a.spent_on)))
const name = computed(() => view.value === 'month' ? `Tháng ${sel.value}/${year.value}` : view.value === 'quarter' ? `Quý ${sel.value}/${year.value}` : `Năm ${year.value}`)
const total = computed(() => shown.value.reduce((a, c) => a + (+c.amount || 0), 0))
const monthly = computed(() => total.value / MONTHS[view.value])
const o = computed(() => {
  const u = Math.max(1, s.units), ovh = monthly.value / u, full = ovh + s.var_cost, margin = s.avg_price - s.var_cost
  return { ovh, full, be: margin > 0 ? Math.ceil(monthly.value / margin) : null, profit: (s.avg_price - full) * u }
})
async function add() {
  err.value = ''
  if (!form.name.trim() || !form.spent_on) return err.value = 'Hãy nhập ngày và tên khoản chi'
  try {
    store.costs.push(await api('company-costs', 'POST', { spent_on: form.spent_on, name: form.name.trim(), amount: +form.amount || 0 }))
    const [y, m] = [+form.spent_on.slice(0, 4), +form.spent_on.slice(5, 7)]
    year.value = y; if (view.value === 'month') sel.value = m; else if (view.value === 'quarter') sel.value = Math.ceil(m / 3)
    form.name = ''; form.amount = null
  } catch (e) { err.value = e.message }
}
const saveCost = c => api(`company-costs/${c.id}`, 'PUT', { spent_on: c.spent_on, name: c.name, amount: c.amount })
async function del(c) { await api(`company-costs/${c.id}`, 'DELETE'); store.costs = store.costs.filter(x => x.id !== c.id) }
const pull = () => s.var_cost = Math.round(compute(store).direct)
function apply() { s.ovh = Math.round(o.value.ovh); router.push('/calc') }
</script>
<template>
  <h1>Chi phí công ty</h1>
  <p class="sub">Ghi từng khoản chi theo ngày, xem thống kê theo tháng, quý, năm và biết mỗi sản phẩm phải gánh bao nhiêu.</p>
  <div class="grid">
    <div>
      <div class="card"><h2>Thống kê chi phí</h2>
        <div class="seg"><button v-for="v in [['month', 'Tháng'], ['quarter', 'Quý'], ['year', 'Năm']]" :key="v[0]" :class="{ on: view === v[0] }" @click="setView(v[0])">{{ v[1] }}</button>
          <span v-if="view !== 'year'" style="margin-left:auto">Năm<input class="yr" v-model.number="year" type="number" min="2000" max="2100" aria-label="Năm"></span></div>
        <div class="scroll"><table class="l"><tbody>
          <tr v-for="r in stats" :key="r.key"><td><button class="lnk" :class="{ on: isSel(r) }" @click="pick(r)">{{ r.label }}</button></td>
            <td style="width:45%"><div class="bar"><i :style="{ width: r.pct + '%' }"></i></div></td><td style="text-align:right">{{ fmt(r.total) }}</td></tr>
        </tbody></table></div></div>
      <div class="card"><h2>Khoản chi {{ name }}</h2>
        <div class="row row4"><input v-model="form.spent_on" type="date" aria-label="Ngày chi"><input v-model="form.name" placeholder="Tên khoản chi (thuê, lương, quảng cáo...)" @keyup.enter="add"><input v-model.number="form.amount" type="number" min="0" placeholder="Số tiền" @keyup.enter="add"><span></span></div>
        <p class="bad" v-if="err">{{ err }}</p>
        <p><button class="btn g" @click="add">Thêm khoản chi</button></p>
        <p class="empty" v-if="!shown.length">Chưa có khoản chi nào trong {{ name }}.</p>
        <div class="row row4" v-for="c in shown" :key="c.id">
          <input v-model="c.spent_on" type="date" aria-label="Ngày chi" @change="saveCost(c)"><input v-model="c.name" aria-label="Tên khoản chi" @change="saveCost(c)">
          <input v-model.number="c.amount" type="number" min="0" aria-label="Số tiền" @change="saveCost(c)"><button class="x" aria-label="Xoá" @click="del(c)">×</button></div></div>
      <div class="card"><h2>Sản lượng và giá (mỗi tháng)</h2><div class="f">
        <label>Số sản phẩm bán / tháng<input v-model.number="s.units" type="number" min="1"></label>
        <label>Giá vốn trực tiếp / sản phẩm (đ)<input v-model.number="s.var_cost" type="number" min="0"></label>
        <label>Giá bán trung bình / sản phẩm (đ)<input v-model.number="s.avg_price" type="number" min="0"></label></div>
        <p><button class="btn g" @click="pull">Lấy giá vốn từ trang Giá in 3D</button></p></div>
    </div>
    <aside class="card res">
      <div class="lbl">Hoà vốn mỗi tháng (theo {{ name }})</div>
      <div class="big">{{ o.be ? o.be.toLocaleString('vi-VN') + ' sản phẩm' : 'Chưa tính được' }}</div>
      <table class="led"><tbody>
        <tr><td>Tổng chi {{ name }}</td><td>{{ fmt(total) }}</td></tr>
        <tr><td>Quy ra mỗi tháng</td><td>{{ fmt(monthly) }}</td></tr>
        <tr><td>Phân bổ / sản phẩm</td><td>{{ fmt(o.ovh) }}</td></tr>
        <tr><td>Giá vốn đầy đủ / sản phẩm</td><td>{{ fmt(o.full) }}</td></tr>
        <tr><td>Doanh thu hoà vốn / tháng</td><td>{{ o.be ? fmt(o.be * s.avg_price) : '—' }}</td></tr>
        <tr class="t"><td>Lợi nhuận / tháng</td><td :class="o.profit >= 0 ? 'ok' : 'bad'">{{ fmt(o.profit) }}</td></tr>
      </tbody></table>
      <p><button class="btn" @click="apply">Áp dụng vào trang Giá in 3D</button></p>
      <p class="note">Lưu mức phân bổ / sản phẩm và chuyển về trang tính giá trong cùng tab.</p>
    </aside>
  </div>
</template>