<script setup>
import { reactive, ref } from 'vue'
import { store } from '../store'
import { api } from '../api'
const props = defineProps({ kind: String })
const cfg = {
  materials: { title: 'Thư viện nhựa', path: 'materials', cols: [['name', 'Tên', 'text'], ['type', 'Loại (PLA, PETG...)', 'text'], ['price_kg', 'Giá / kg (đ)', 'number']] },
  machines: { title: 'Thư viện máy in', path: 'machines', cols: [['name', 'Tên máy', 'text'], ['kw', 'Công suất TB (kW)', 'number'], ['life_hours', 'Tuổi thọ (giờ)', 'number'], ['price', 'Giá mua (đ)', 'number']] }
}[props.kind]
const form = reactive({}), err = ref('')
async function add() {
  err.value = ''
  if (!form.name?.trim()) return err.value = 'Hãy nhập tên'
  try {
    const row = await api(cfg.path, 'POST', { ...form })
    store[props.kind].push(row)
    if (!store.calc[props.kind === 'materials' ? 'material' : 'machine']) store.calc[props.kind === 'materials' ? 'material' : 'machine'] = row.id
    Object.keys(form).forEach(k => delete form[k])
  } catch (e) { err.value = e.message }
}
async function save(row) { try { await api(`${cfg.path}/${row.id}`, 'PUT', Object.fromEntries(cfg.cols.map(c => [c[0], row[c[0]]]))) } catch (e) { err.value = e.message } }
async function del(row) {
  await api(`${cfg.path}/${row.id}`, 'DELETE')
  store[props.kind] = store[props.kind].filter(x => x.id !== row.id)
}
</script>
<template>
  <div class="card"><h2>{{ cfg.title }}</h2>
    <div class="f"><label v-for="c in cfg.cols" :key="c[0]">{{ c[1] }}<input v-model="form[c[0]]" :type="c[2]" @keyup.enter="add"></label></div>
    <p class="bad" v-if="err">{{ err }}</p>
    <p><button class="btn" @click="add">Thêm</button></p>
    <p class="empty" v-if="!store[kind].length">Chưa có mục nào. Thêm mục đầu tiên ở trên.</p>
    <table class="l" v-else>
      <thead><tr><th v-for="c in cfg.cols" :key="c[0]">{{ c[1] }}</th><th></th></tr></thead>
      <tbody><tr v-for="row in store[kind]" :key="row.id">
        <td v-for="c in cfg.cols" :key="c[0]"><input v-model="row[c[0]]" :type="c[2]" @change="save(row)"></td>
        <td><button class="x" aria-label="Xoá" @click="del(row)">×</button></td></tr></tbody>
    </table>
  </div>
</template>
