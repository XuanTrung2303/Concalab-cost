<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../store'
import { api } from '../api'
import { compute, fmt } from '../util'
const router = useRouter(), s = store.set, now = new Date(), today = now.toLocaleDateString('sv-SE')
const curSel = v => v === 'month' ? now.getMonth() + 1 : Math.ceil((now.getMonth() + 1) / 3)
const tab = ref('cost'), view = ref('month'), year = ref(now.getFullYear()), sel = ref(curSel('month'))
const form = reactive({ spent_on: today, name: '', amount: null }), sf = reactive({ sold_on: today, revenue: null, cogs: null })
const err = ref(''), err2 = ref('')
const MONTHS = { month: 1, quarter: 3, year: 12 }
const SHOW_BREAKEVEN = false // tạm ẩn phần hoà vốn và sản lượng; đổi thành true để hiện lại
const setView = v => { view.value = v; sel.value = curSel(v) }
const ymd = d => [+d.slice(0, 4), +d.slice(5, 7)]
const inKey = (d, k) => { const [y, m] = ymd(d); return view.value === 'year' ? y === k : y === year.value && (view.value === 'month' ? m === k : Math.ceil(m / 3) === k) }
const keys = computed(() => view.value === 'month' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : view.value === 'quarter' ? [1, 2, 3, 4]
  : [...new Set([...store.costs.map(c => ymd(c.spent_on)[0]), ...store.sales.map(c => ymd(c.sold_on)[0]), now.getFullYear(), year.value])].sort())
const lab = k => view.value === 'month' ? `Tháng ${k}` : view.value === 'quarter' ? `Quý ${k}` : `Năm ${k}`
const tot = (list, dk, vk, k) => list.filter(x => inKey(x[dk], k)).reduce((a, x) => a + (+x[vk] || 0), 0)
const rows = computed(() => keys.value.map(k => {
  const cost = tot(store.costs, 'spent_on', 'amount', k), rev = tot(store.sales, 'sold_on', 'revenue', k), cogs = tot(store.sales, 'sold_on', 'cogs', k)
  return { key: k, label: lab(k), cost, rev, cogs, profit: rev - cogs - cost }
}))
const scale = f => { const mx = Math.max(1, ...rows.value.map(r => Math.abs(f(r)))); return rows.value.map(r => ({ ...r, pct: Math.abs(f(r)) / mx * 100 })) }
const cstats = computed(() => scale(r => r.cost)), pstats = computed(() => scale(r => r.profit))
const selKey = computed(() => view.value === 'year' ? year.value : sel.value)
const pick = r => view.value === 'year' ? year.value = r.key : sel.value = r.key
const isSel = r => r.key === selKey.value
const cur = computed(() => rows.value.find(r => r.key === selKey.value) || { cost: 0, rev: 0, cogs: 0, profit: 0 })
const name = computed(() => view.value === 'month' ? `Tháng ${sel.value}/${year.value}` : view.value === 'quarter' ? `Quý ${sel.value}/${year.value}` : `Năm ${year.value}`)
const costs = computed(() => store.costs.filter(c => inKey(c.spent_on, selKey.value)).sort((a, b) => b.spent_on.localeCompare(a.spent_on)))
const sales = computed(() => store.sales.filter(c => inKey(c.sold_on, selKey.value)).sort((a, b) => b.sold_on.localeCompare(a.sold_on)))
const monthly = computed(() => cur.value.cost / MONTHS[view.value])
const margin = computed(() => cur.value.rev ? (cur.value.profit / cur.value.rev * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%' : '—')
const o = computed(() => {
  const u = Math.max(1, s.units), ovh = monthly.value / u, full = ovh + s.var_cost, m = s.avg_price - s.var_cost
  return { ovh, full, be: m > 0 ? Math.ceil(monthly.value / m) : null, profit: (s.avg_price - full) * u }
})
function goTo(d) { const [y, m] = ymd(d); year.value = y; if (view.value === 'month') sel.value = m; else if (view.value === 'quarter') sel.value = Math.ceil(m / 3) }
async function addCost() {
  err.value = ''
  if (!form.name.trim() || !form.spent_on) return err.value = 'Hãy nhập ngày và tên khoản chi'
  try { store.costs.push(await api('company-costs', 'POST', { spent_on: form.spent_on, name: form.name.trim(), amount: +form.amount || 0 })); goTo(form.spent_on); form.name = ''; form.amount = null } catch (e) { err.value = e.message }
}
async function addSale() {
  err2.value = ''
  if (!sf.sold_on || !(+sf.revenue > 0)) return err2.value = 'Hãy nhập ngày và doanh thu của ngày đó'
  const body = { sold_on: sf.sold_on, name: 'Doanh thu ngày', revenue: +sf.revenue, cogs: +sf.cogs || 0 }
  try {
    const same = store.sales.filter(x => x.sold_on === sf.sold_on)
    if (same.length) { // mỗi ngày chỉ có một dòng: ghi đè dòng cũ
      Object.assign(same[0], await api(`sales/${same[0].id}`, 'PUT', body))
      for (const x of same.slice(1)) { await api(`sales/${x.id}`, 'DELETE'); store.sales = store.sales.filter(y => y.id !== x.id) }
    } else store.sales.push(await api('sales', 'POST', body))
    goTo(sf.sold_on); sf.revenue = sf.cogs = null
  } catch (e) { err2.value = e.message }
}
const saveCost = c => api(`company-costs/${c.id}`, 'PUT', { spent_on: c.spent_on, name: c.name, amount: c.amount })
const saveSale = c => api(`sales/${c.id}`, 'PUT', { sold_on: c.sold_on, name: c.name, revenue: c.revenue, cogs: c.cogs })
async function delCost(c) { await api(`company-costs/${c.id}`, 'DELETE'); store.costs = store.costs.filter(x => x.id !== c.id) }
async function delSale(c) { await api(`sales/${c.id}`, 'DELETE'); store.sales = store.sales.filter(x => x.id !== c.id) }
const pull = () => s.var_cost = Math.round(compute(store).direct)
function apply() { s.ovh = Math.round(o.value.ovh); router.push('/calc') }
</script>
<template>
  <h1>Chi phí và lợi nhuận</h1>
  <p class="sub">Ghi chi phí và doanh thu theo ngày, xem thống kê theo tháng, quý, năm.</p>
  <div class="ctl">
    <div class="sw lt"><button :class="{ on: tab === 'cost' }" @click="tab = 'cost'">Chi phí</button><button :class="{ on: tab === 'profit' }" @click="tab = 'profit'">Lợi nhuận</button></div>
    <div class="seg"><button v-for="v in [['month', 'Tháng'], ['quarter', 'Quý'], ['year', 'Năm']]" :key="v[0]" :class="{ on: view === v[0] }" @click="setView(v[0])">{{ v[1] }}</button>
      <span v-if="view !== 'year'">Năm<input class="yr" v-model.number="year" type="number" min="2000" max="2100" aria-label="Năm"></span></div>
  </div>

  <div class="grid" v-if="tab === 'cost'" :style="SHOW_BREAKEVEN ? null : { gridTemplateColumns: '1fr' }">
    <div>
      <div class="card"><h2>Thống kê chi phí</h2>
        <div class="scroll"><table class="l"><tbody>
          <tr v-for="r in cstats" :key="r.key"><td><button class="lnk" :class="{ on: isSel(r) }" @click="pick(r)">{{ r.label }}</button></td>
            <td style="width:45%"><div class="pbar"><i :style="{ width: r.pct + '%' }"></i></div></td><td class="n">{{ fmt(r.cost) }}</td></tr>
        </tbody></table></div></div>
      <div class="card"><h2>Khoản chi {{ name }}</h2>
        <p class="lbl">Tổng chi: <b>{{ fmt(cur.cost) }}</b></p>
        <div class="row row4"><input v-model="form.spent_on" type="date" aria-label="Ngày chi"><input v-model="form.name" placeholder="Tên khoản chi (thuê, lương, quảng cáo...)" @keyup.enter="addCost"><NumInput v-model="form.amount" min="0" placeholder="Số tiền" @keyup.enter="addCost" /><span></span></div>
        <p class="bad" v-if="err">{{ err }}</p>
        <p><button class="btn g" @click="addCost">Thêm khoản chi</button></p>
        <p class="empty" v-if="!costs.length">Chưa có khoản chi nào trong {{ name }}.</p>
        <div class="row row4" v-for="c in costs" :key="c.id">
          <input v-model="c.spent_on" type="date" aria-label="Ngày chi" @change="saveCost(c)"><input v-model="c.name" aria-label="Tên khoản chi" @change="saveCost(c)">
          <NumInput v-model="c.amount" min="0" aria-label="Số tiền" @change="saveCost(c)" /><button class="x" aria-label="Xoá" @click="delCost(c)">×</button></div></div>
      <div class="card" v-if="SHOW_BREAKEVEN"><h2>Sản lượng và giá (mỗi tháng)</h2><div class="f">
        <label>Số sản phẩm bán / tháng<NumInput v-model="s.units" min="1" /></label>
        <label>Giá vốn trực tiếp / sản phẩm (đ)<NumInput v-model="s.var_cost" min="0" /></label>
        <label>Giá bán trung bình / sản phẩm (đ)<NumInput v-model="s.avg_price" min="0" /></label></div>
        <p><button class="btn g" @click="pull">Lấy giá vốn từ trang Giá in 3D</button></p></div>
    </div>
    <aside class="card res" v-if="SHOW_BREAKEVEN">
      <div class="lbl">Hoà vốn mỗi tháng (theo {{ name }})</div>
      <div class="big">{{ o.be ? o.be.toLocaleString('vi-VN') + ' sản phẩm' : 'Chưa tính được' }}</div>
      <table class="led"><tbody>
        <tr><td>Tổng chi {{ name }}</td><td>{{ fmt(cur.cost) }}</td></tr>
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

  <div class="grid" v-else>
    <div>
      <div class="card"><h2>Thống kê lợi nhuận</h2>
        <div class="scroll"><table class="l">
          <thead><tr><th>Kỳ</th><th class="n">Doanh thu</th><th class="n">Giá vốn</th><th class="n">Chi phí đã chi</th><th class="n">Lợi nhuận</th></tr></thead>
          <tbody><tr v-for="r in pstats" :key="r.key"><td><button class="lnk" :class="{ on: isSel(r) }" @click="pick(r)">{{ r.label }}</button></td>
            <td class="n">{{ fmt(r.rev) }}</td><td class="n">{{ fmt(r.cogs) }}</td><td class="n">{{ fmt(r.cost) }}</td>
            <td class="n"><b :class="r.profit >= 0 ? 'ok' : 'bad'">{{ fmt(r.profit) }}</b><div class="pbar" :class="{ neg: r.profit < 0 }"><i :style="{ width: r.pct + '%' }"></i></div></td></tr>
          </tbody></table></div></div>
      <div class="card"><h2>Doanh thu {{ name }}</h2>
        <div class="row row4"><input v-model="sf.sold_on" type="date" aria-label="Ngày"><NumInput v-model="sf.revenue" placeholder="Tổng doanh thu trong ngày" @keyup.enter="addSale" /><NumInput v-model="sf.cogs" placeholder="Giá vốn" @keyup.enter="addSale" /><span></span></div>
        <p class="bad" v-if="err2">{{ err2 }}</p>
        <p><button class="btn g" @click="addSale">Lưu doanh thu ngày</button></p>
        <p class="note">Chỉ cần nhập tổng doanh thu của ngày. Nhập lại cùng ngày sẽ ghi đè số cũ. Giá vốn trực tiếp (nhựa, điện, khấu hao, công) là không bắt buộc; để trống thì lợi nhuận chỉ trừ chi phí công ty.</p>
        <p class="empty" v-if="!sales.length">Chưa có doanh thu nào trong {{ name }}.</p>
        <div class="row row4" v-for="c in sales" :key="c.id">
          <input v-model="c.sold_on" type="date" aria-label="Ngày" @change="saveSale(c)"><NumInput v-model="c.revenue" aria-label="Doanh thu" @change="saveSale(c)" /><NumInput v-model="c.cogs" aria-label="Giá vốn" @change="saveSale(c)" />
          <button class="x" aria-label="Xoá" @click="delSale(c)">×</button></div></div>
    </div>
    <aside class="card res">
      <div class="lbl">Lợi nhuận ròng {{ name }}</div>
      <div class="big" :class="cur.profit >= 0 ? 'ok' : 'bad'">{{ fmt(cur.profit) }}</div>
      <table class="led"><tbody>
        <tr><td>Doanh thu</td><td>{{ fmt(cur.rev) }}</td></tr>
        <tr><td>Giá vốn trực tiếp</td><td>{{ fmt(cur.cogs) }}</td></tr>
        <tr><td>Lãi gộp</td><td>{{ fmt(cur.rev - cur.cogs) }}</td></tr>
        <tr><td>Chi phí đã chi (tab Chi phí)</td><td>{{ fmt(cur.cost) }}</td></tr>
        <tr class="t"><td>Lợi nhuận ròng</td><td :class="cur.profit >= 0 ? 'ok' : 'bad'">{{ fmt(cur.profit) }}</td></tr>
        <tr><td>Biên lợi nhuận</td><td>{{ margin }}</td></tr>
      </tbody></table>
      <div class="lbl" style="margin-top:14px">Các khoản chi đã trừ trong {{ name }}</div>
      <p class="empty" v-if="!costs.length">Chưa có khoản chi nào. Thêm ở tab Chi phí.</p>
      <table class="led" v-else><tbody><tr v-for="c in costs" :key="c.id"><td>{{ c.name }}</td><td>{{ fmt(c.amount) }}</td></tr></tbody></table>
    </aside>
  </div>
</template>