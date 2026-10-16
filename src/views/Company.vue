<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../store'
import { api } from '../api'
import { compute, fmt } from '../util'
const router = useRouter(), s = store.set
const total = computed(() => store.costs.reduce((a, c) => a + (+c.amount || 0), 0))
const o = computed(() => {
  const u = Math.max(1, s.units), ovh = total.value / u, full = ovh + s.var_cost
  const margin = s.avg_price - s.var_cost, be = margin > 0 ? Math.ceil(total.value / margin) : null
  return { ovh, full, be, profit: (s.avg_price - full) * u }
})
const saveCost = c => api(`company-costs/${c.id}`, 'PUT', { name: c.name, amount: c.amount })
async function add() { store.costs.push(await api('company-costs', 'POST', { name: 'Khoản chi mới', amount: 0 })) }
async function del(c) { await api(`company-costs/${c.id}`, 'DELETE'); store.costs = store.costs.filter(x => x.id !== c.id) }
const pull = () => s.var_cost = Math.round(compute(store).direct)
function apply() { s.ovh = Math.round(o.value.ovh); router.push('/calc') }
</script>
<template>
  <h1>Chi phí công ty</h1>
  <p class="sub">Nhập chi phí cố định hằng tháng để biết mỗi sản phẩm phải gánh bao nhiêu và khi nào hoà vốn.</p>
  <div class="grid">
    <div>
      <div class="card"><h2>Chi phí cố định hằng tháng</h2>
        <p class="empty" v-if="!store.costs.length">Chưa có khoản chi nào. Thêm tiền thuê, lương, điện nước, quảng cáo...</p>
        <div class="row" v-for="c in store.costs" :key="c.id">
          <input v-model="c.name" aria-label="Tên khoản chi" @change="saveCost(c)">
          <input v-model.number="c.amount" type="number" min="0" aria-label="Số tiền" @change="saveCost(c)">
          <button class="x" aria-label="Xoá" @click="del(c)">×</button></div>
        <button class="btn g" @click="add">Thêm khoản chi</button></div>
      <div class="card"><h2>Sản lượng và giá</h2><div class="f">
        <label>Số sản phẩm bán / tháng<input v-model.number="s.units" type="number" min="1"></label>
        <label>Giá vốn trực tiếp / sản phẩm (đ)<input v-model.number="s.var_cost" type="number" min="0"></label>
        <label>Giá bán trung bình / sản phẩm (đ)<input v-model.number="s.avg_price" type="number" min="0"></label></div>
        <p><button class="btn g" @click="pull">Lấy giá vốn từ trang Giá in 3D</button></p></div>
    </div>
    <aside class="card res">
      <div class="lbl">Hoà vốn mỗi tháng</div>
      <div class="big">{{ o.be ? o.be.toLocaleString('vi-VN') + ' sản phẩm' : 'Chưa tính được' }}</div>
      <table class="led">
        <tr><td>Tổng chi phí cố định / tháng</td><td>{{ fmt(total) }}</td></tr>
        <tr><td>Phân bổ / sản phẩm</td><td>{{ fmt(o.ovh) }}</td></tr>
        <tr><td>Giá vốn đầy đủ / sản phẩm</td><td>{{ fmt(o.full) }}</td></tr>
        <tr><td>Doanh thu hoà vốn</td><td>{{ o.be ? fmt(o.be * s.avg_price) : '—' }}</td></tr>
        <tr class="t"><td>Lợi nhuận / tháng</td><td :class="o.profit >= 0 ? 'ok' : 'bad'">{{ fmt(o.profit) }}</td></tr>
      </table>
      <p><button class="btn" @click="apply">Áp dụng vào trang Giá in 3D</button></p>
      <p class="note">Lưu mức phân bổ / sản phẩm và chuyển về trang tính giá trong cùng tab.</p>
    </aside>
  </div>
</template>
