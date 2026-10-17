<script setup>
import { computed, ref } from 'vue'
import { store, resetCalc } from '../store'
import { compute, fmt } from '../util'
import { api } from '../api'
const c = store.calc, r = computed(() => compute(store)), note = ref('')
const rows = computed(() => [['Nhựa', r.value.mat], ['Điện', r.value.elec], ['Khấu hao máy', r.value.dep], ['Công xử lý', r.value.labor], ['Phụ kiện', r.value.accTray], ['Chi phí khác', c.other], [`Dự phòng in hỏng (${store.set.fail}%)`, r.value.risk]].filter(x => x[0] !== 'Phụ kiện' || store.set.use_acc !== false))
async function copy() {
  const t = `Báo giá Concalab\nSản phẩm: ${c.name || '—'} · ${r.value.q} cái/khay\nGiá bán: ${fmt(r.value.price)}/sản phẩm\nCả khay: ${fmt(r.value.price * r.value.q)}`
  try { await navigator.clipboard.writeText(t); note.value = 'Đã copy' } catch { note.value = 'Không copy được' }
  setTimeout(() => note.value = '', 2000)
}
const depHour = computed(() => r.value.m?.life_hours ? r.value.m.price / r.value.m.life_hours : 0)
// Tỷ lệ tính trên chi phí trước dự phòng, nên dòng dự phòng luôn hiện đúng tỷ lệ trong Cài đặt
const pct = v => r.value.sub ? Math.round(v / r.value.sub * 100) : 0
// Nhựa: mỗi dòng là một loại nhựa (một màu) với số gram riêng
const colorOf = id => store.materials.find(x => x.id === id)?.color || '#cccccc'
const lineCost = l => (+l.gram || 0) * (store.materials.find(x => x.id === l.id)?.price_kg || 0) / 1000
const totalGram = computed(() => c.mats.reduce((a, l) => a + (+l.gram || 0), 0))
const addMat = () => c.mats.push({ id: store.materials[0]?.id ?? null, gram: 0 })
const err = ref('')
async function saveProduct() {
  err.value = ''
  if (!c.name.trim()) return err.value = 'Hãy đặt tên sản phẩm'
  const body = { name: c.name.trim(), sku: c.sku.trim(), inputs: JSON.parse(JSON.stringify(c)), unit_cost: r.value.unit, price: r.value.price, profit: r.value.profit }
  try {
    if (store.editing) {
      const row = await api(`products/${store.editing}`, 'PUT', body)
      const i = store.products.findIndex(p => p.id === row.id); if (i >= 0) store.products[i] = row
      note.value = 'Đã cập nhật sản phẩm'
    } else {
      const row = await api('products', 'POST', body)
      store.products.push(row); store.editing = row.id; note.value = 'Đã thêm vào Sản phẩm'
    }
  } catch (e) { err.value = e.message }
  setTimeout(() => note.value = '', 2500)
}
function fresh() { resetCalc(); err.value = ''; note.value = '' }
</script>
<template>
  <h1>Tính giá in 3D</h1>
  <p class="sub">Giá vốn và giá bán đề xuất cho một khay in.</p>
  <div class="grid">
    <div>
      <div class="card"><h2>Sản phẩm</h2><div class="f">
        <label>Tên sản phẩm<input v-model="c.name" placeholder="Ví dụ: Móc khoá bảng tên"></label>
        <label>Mã SKU (tuỳ chọn)<input v-model="c.sku"></label></div>
        <p class="note" v-if="store.editing">Đang sửa sản phẩm đã lưu. <a href="#" @click.prevent="fresh">Tạo sản phẩm mới</a></p></div>
      <div class="card"><h2>Máy in</h2>
        <label>Máy in<select v-model="c.machine"><option v-for="m in store.machines" :key="m.id" :value="m.id">{{ m.name }}</option></select></label>
        <p class="lbl" v-if="r.m">{{ r.m.kw }} kW · khấu hao {{ fmt(depHour) }}/giờ</p>
        <p class="warn" v-if="depHour > 20000">Khấu hao máy đang là {{ fmt(depHour) }}/giờ, có vẻ quá cao. Kiểm tra Giá mua và Tuổi thọ của máy trong tab <router-link to="/machines">Máy in</router-link>.</p>
        <p class="note" v-if="!r.m">Chưa có máy. Thêm ở tab <router-link to="/machines">Máy in</router-link>.</p></div>
      <div class="card"><h2>Thông số in</h2><div class="f">
        <label>Thời gian in (giờ)<NumInput v-model="c.h" min="0" /></label>
        <label>Thời gian in (phút)<NumInput v-model="c.min" min="0" max="59" /></label>
        <label>Thời gian xử lý (phút)<NumInput v-model="c.handle" min="0" /></label>
        <label>Số sản phẩm trong khay<NumInput v-model="c.qty" min="1" /></label>
        <label>Chi phí khác cả khay (đ)<NumInput v-model="c.other" min="0" /></label>
      </div></div>
      <div class="card"><div class="head"><h2>Nhựa</h2><span class="lbl" v-if="totalGram">{{ totalGram }}g · {{ fmt(r.mat) }}</span></div>
        <p class="note" v-if="!store.materials.length">Chưa có nhựa. Thêm ở tab <router-link to="/materials">Nhựa</router-link>.</p>
        <div class="mrow" v-for="(l, i) in c.mats" :key="i">
          <div class="msel"><i class="dot" :style="{ background: colorOf(l.id) }"></i>
            <select v-model="l.id" aria-label="Loại nhựa"><option :value="null" disabled>— chọn nhựa —</option><option v-for="m in store.materials" :key="m.id" :value="m.id">{{ m.name }} ({{ m.type }})</option></select></div>
          <NumInput v-model="l.gram" placeholder="Gram" aria-label="Số gram" />
          <span class="n">{{ fmt(lineCost(l)) }}</span>
          <button v-if="c.mats.length > 1" class="x" aria-label="Bỏ loại nhựa" @click="c.mats.splice(i, 1)">×</button><span v-else></span></div>
        <button class="btn g" v-if="store.materials.length" @click="addMat">+ Thêm loại nhựa</button>
        <p class="lbl">Nhập số gram của từng màu cho cả khay in.</p></div>
      <div class="card" v-if="store.set.use_acc !== false"><h2>Phụ kiện</h2>
        <p class="empty" v-if="!store.accessories.length">Chưa có phụ kiện. Thêm ở tab <router-link to="/accessories">Phụ kiện</router-link>.</p>
        <div class="row" v-for="(a, i) in c.acc" :key="i">
          <select v-model="a.id" aria-label="Phụ kiện"><option v-for="p in store.accessories" :key="p.id" :value="p.id">{{ p.name }} ({{ fmt(p.pack_qty ? p.pack_price / p.pack_qty : 0) }}/cái)</option></select>
          <NumInput v-model="a.qty" aria-label="Số lượng cho mỗi sản phẩm" />
          <button class="x" aria-label="Bỏ phụ kiện" @click="c.acc.splice(i, 1)">×</button></div>
        <button class="btn g" v-if="store.accessories.length" @click="c.acc.push({ id: store.accessories[0].id, qty: 1 })">+ Thêm phụ kiện</button>
        <p class="lbl" v-if="c.acc.length">Số lượng tính cho mỗi sản phẩm. Phụ kiện / sản phẩm: {{ fmt(r.accUnit) }}</p></div>
      <div class="card"><h2>Kênh bán</h2><div class="f">
        <label>Phí sàn (%)<NumInput v-model="c.fee" min="0" max="60" step=".1" /></label>
        <label>Phí cố định mỗi đơn (đ)<NumInput v-model="c.fixed" min="0" /></label>
      </div></div>
    </div>
    <aside class="card res">
      <div class="lbl">Giá bán đề xuất / sản phẩm</div><div class="big">{{ fmt(r.price) }}</div>
      <div class="two"><div><div class="lbl">Giá vốn / sản phẩm</div><b>{{ fmt(r.unit) }}</b></div>
        <div><div class="lbl">Lợi nhuận / sản phẩm</div><b :class="r.profit >= 0 ? 'ok' : 'bad'">{{ fmt(r.profit) }}</b></div></div>
      <table class="led">
<tbody>
        <tr v-for="x in rows" :key="x[0]"><td>{{ x[0] }}<div class="lbl" v-for="(l, i) in (x[0] === 'Nhựa' ? r.matLines : [])" :key="i"><i class="dot" :style="{ background: l.t.color || '#ccc' }"></i>{{ l.t.name }} · {{ l.gram }}g · {{ fmt(l.cost) }}</div>
          <div class="pbar"><i :style="{ width: pct(x[1]) + '%' }"></i></div></td><td>{{ fmt(x[1]) }}<div class="lbl">{{ pct(x[1]) }}%</div></td></tr>
        <tr class="t"><td>Giá vốn cả khay</td><td>{{ fmt(r.batch) }}</td></tr>
      </tbody>
</table>
      <div class="two"><div><div class="lbl">Giá bán cả khay</div><b>{{ fmt(r.price * r.q) }}</b></div>
        <div><div class="lbl">Lợi nhuận cả khay</div><b :class="r.profit >= 0 ? 'ok' : 'bad'">{{ fmt(r.profit * r.q) }}</b></div></div>
      <button class="btn" @click="copy">Copy báo giá</button> <span class="lbl">{{ note }}</span>
      <p><button class="btn g" @click="saveProduct">{{ store.editing ? 'Cập nhật sản phẩm' : 'Lưu vào Sản phẩm' }}</button></p>
      <p class="bad" v-if="err">{{ err }}</p>
    </aside>
  </div>
</template>
<style scoped>
.head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.mrow{display:grid;grid-template-columns:1fr 110px 90px 32px;gap:8px;align-items:center;margin-bottom:8px}
.msel{display:flex;align-items:center;gap:8px;min-width:0}.msel select,.mrow input{margin:0}
.mrow .n{text-align:right}
@media(max-width:600px){.mrow{grid-template-columns:1fr 90px 32px}.mrow .n{display:none}}
</style>