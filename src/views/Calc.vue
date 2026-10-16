<script setup>
import { computed, ref } from 'vue'
import { store } from '../store'
import { compute, fmt } from '../util'
const c = store.calc, r = computed(() => compute(store)), note = ref('')
const rows = computed(() => [['Nhựa', r.value.mat], ['Điện', r.value.elec], ['Khấu hao máy', r.value.dep], ['Dự phòng in hỏng', r.value.risk], ['Công xử lý', r.value.labor], ['Chi phí khác', c.other]])
async function copy() {
  const t = `Báo giá Concalab\nSản phẩm: ${r.value.t?.name || '—'} · ${r.value.q} cái/khay\nGiá bán: ${fmt(r.value.price)}/sản phẩm\nCả khay: ${fmt(r.value.price * r.value.q)}`
  try { await navigator.clipboard.writeText(t); note.value = 'Đã copy' } catch { note.value = 'Không copy được' }
  setTimeout(() => note.value = '', 2000)
}
</script>
<template>
  <h1>Tính giá in 3D</h1>
  <p class="sub">Giá vốn và giá bán đề xuất cho một khay in.</p>
  <div class="grid">
    <div>
      <div class="card"><h2>Máy và nhựa</h2><div class="f">
        <label>Máy in<select v-model="c.machine"><option v-for="m in store.machines" :key="m.id" :value="m.id">{{ m.name }}</option></select></label>
        <label>Loại nhựa<select v-model="c.material"><option v-for="m in store.materials" :key="m.id" :value="m.id">{{ m.name }}</option></select></label>
        <label>Số gram nhựa (cả khay)<input v-model.number="c.gram" type="number" min="0"></label>
      </div>
      <p class="note" v-if="!r.m || !r.t">Chưa có máy hoặc nhựa. Thêm ở tab <router-link to="/machines">Máy in</router-link> và <router-link to="/materials">Nhựa</router-link>.</p></div>
      <div class="card"><h2>Thông số in</h2><div class="f">
        <label>Thời gian in (giờ)<input v-model.number="c.h" type="number" min="0"></label>
        <label>Thời gian in (phút)<input v-model.number="c.min" type="number" min="0" max="59"></label>
        <label>Thời gian xử lý (phút)<input v-model.number="c.handle" type="number" min="0"></label>
        <label>Số sản phẩm trong khay<input v-model.number="c.qty" type="number" min="1"></label>
        <label>Chi phí khác cả khay (đ)<input v-model.number="c.other" type="number" min="0"></label>
      </div></div>
      <div class="card"><h2>Kênh bán</h2><div class="f">
        <label>Phí sàn (%)<input v-model.number="c.fee" type="number" min="0" max="60" step=".1"></label>
        <label>Phí cố định mỗi đơn (đ)<input v-model.number="c.fixed" type="number" min="0"></label>
      </div></div>
    </div>
    <aside class="card res">
      <div class="lbl">Giá bán đề xuất / sản phẩm</div><div class="big">{{ fmt(r.price) }}</div>
      <div class="two"><div><div class="lbl">Giá vốn / sản phẩm</div><b>{{ fmt(r.unit) }}</b></div>
        <div><div class="lbl">Lợi nhuận / sản phẩm</div><b :class="r.profit >= 0 ? 'ok' : 'bad'">{{ fmt(r.profit) }}</b></div></div>
      <table class="led">
        <tr v-for="x in rows" :key="x[0]"><td>{{ x[0] }}</td><td>{{ fmt(x[1]) }}</td></tr>
        <tr class="t"><td>Giá vốn cả khay</td><td>{{ fmt(r.batch) }}</td></tr>
        <tr v-if="store.set.ovh"><td>Chi phí công ty / sản phẩm</td><td>{{ fmt(store.set.ovh) }}</td></tr>
      </table>
      <div class="two"><div><div class="lbl">Giá bán cả khay</div><b>{{ fmt(r.price * r.q) }}</b></div>
        <div><div class="lbl">Lợi nhuận cả khay</div><b :class="r.profit >= 0 ? 'ok' : 'bad'">{{ fmt(r.profit * r.q) }}</b></div></div>
      <button class="btn" @click="copy">Copy báo giá</button> <span class="lbl">{{ note }}</span>
    </aside>
  </div>
</template>
