<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../store'
import { api } from '../api'
import { fmt } from '../util'
const router = useRouter(), q = ref(''), note = ref('')
const list = computed(() => store.products
  .filter(p => `${p.name} ${p.sku || ''}`.toLowerCase().includes(q.value.toLowerCase()))
  .sort((a, b) => b.created_at.localeCompare(a.created_at)))
function open(p) { Object.assign(store.calc, { acc: [] }, JSON.parse(JSON.stringify(p.inputs))); store.editing = p.id; router.push('/calc') }
async function del(p) {
  if (!confirm(`Xoá sản phẩm "${p.name}"?`)) return
  await api(`products/${p.id}`, 'DELETE')
  store.products = store.products.filter(x => x.id !== p.id)
  if (store.editing === p.id) store.editing = null
}
async function copy(p) {
  try { await navigator.clipboard.writeText(`Báo giá Concalab\nSản phẩm: ${p.name}\nGiá bán: ${fmt(p.price)}`); note.value = 'Đã copy' } catch { note.value = 'Không copy được' }
  setTimeout(() => note.value = '', 2000)
}
</script>
<template>
  <div class="card"><h2>Sản phẩm đã lưu</h2>
    <label>Tìm theo tên hoặc SKU<input v-model="q"></label>
    <p class="empty" v-if="!store.products.length">Chưa có sản phẩm nào. Tính giá ở tab <router-link to="/calc">Tính giá</router-link> rồi bấm Lưu vào Sản phẩm.</p>
    <p class="empty" v-else-if="!list.length">Không có sản phẩm khớp với từ khoá.</p>
    <div class="scroll" v-else><table class="l">
      <thead><tr><th>Tên</th><th>SKU</th><th>Giá vốn</th><th>Giá bán</th><th>Lợi nhuận</th><th></th></tr></thead>
      <tbody><tr v-for="p in list" :key="p.id">
        <td>{{ p.name }}</td><td>{{ p.sku || '—' }}</td><td>{{ fmt(p.unit_cost) }}</td><td><b>{{ fmt(p.price) }}</b></td>
        <td :class="p.profit >= 0 ? 'ok' : 'bad'">{{ fmt(p.profit) }}</td>
        <td style="white-space:nowrap"><button class="btn g" @click="open(p)">Mở để tính</button> <button class="btn g" @click="copy(p)">Copy báo giá</button> <button class="x" aria-label="Xoá" @click="del(p)">×</button></td>
      </tr></tbody></table></div>
    <p class="lbl">{{ note }}</p>
  </div>
</template>