<script setup>
import { reactive, ref } from 'vue'
import { store } from '../store'
import { api } from '../api'
import { fmt } from '../util'
const props = defineProps({ kind: String })
const COLORS = ['#1a1a1a', '#f5f5f5', '#8a8a8a', '#d32f2f', '#f57c00', '#fbc02d', '#2e9d4f', '#2f6fe4', '#8e44ad', '#e84393', '#8d5524']
const cfg = {
  materials: { path: 'materials', title: 'Thư viện nhựa', keys: ['name', 'type', 'price_kg', 'color'],
    cols: [['name', 'Tên', 'text', 'Ví dụ: PLA đen Esun'], ['type', 'Loại', 'text', 'PLA, PETG, ABS...'], ['price_kg', 'Giá / kg (đ)', 'number', '350,000']] },
  machines: { path: 'machines', title: 'Thư viện máy in', keys: ['name', 'kw', 'life_hours', 'price'],
    cols: [['name', 'Tên máy', 'text', 'Ví dụ: Bambu Lab A1'], ['kw', 'Công suất TB (kW)', 'number', '0.1'], ['life_hours', 'Tuổi thọ (giờ)', 'number', '5000'], ['price', 'Giá mua (đ)', 'number', '9,000,000']] }
, accessories: { path: 'accessories', title: 'Danh sách phụ kiện', keys: ['name', 'grp', 'pack_qty', 'pack_price'],
    cols: [['name', 'Tên', 'text', 'Móc khoá'], ['grp', 'Nhóm', 'text', 'Phụ kiện'], ['pack_qty', 'Số lượng / pack', 'number', '100'], ['pack_price', 'Giá / pack (đ)', 'number', '100,000']] }
}[props.kind]
const isMat = props.kind === 'materials', isAcc = props.kind === 'accessories'
const form = reactive(isMat ? { color: COLORS[0] } : {}), err = ref('')
async function add() {
  err.value = ''
  if (!form.name?.trim()) return err.value = 'Hãy nhập tên'
  try {
    const row = await api(cfg.path, 'POST', Object.fromEntries(Object.entries(form).filter(([, v]) => v !== undefined && v !== null)))
    store[props.kind].push(row)
    if (!isAcc) { const k = isMat ? 'material' : 'machine'; if (!store.calc[k]) store.calc[k] = row.id }
    Object.keys(form).forEach(x => delete form[x]); if (isMat) form.color = COLORS[0]
  } catch (e) { err.value = e.message }
}
async function save(row) { try { await api(`${cfg.path}/${row.id}`, 'PUT', Object.fromEntries(cfg.keys.map(k => [k, row[k]]))) } catch (e) { err.value = e.message } }
async function del(row) {
  await api(`${cfg.path}/${row.id}`, 'DELETE')
  store[props.kind] = store[props.kind].filter(x => x.id !== row.id)
}
</script>
<template>
  <div class="card" v-if="isAcc"><h2>Sử dụng khi tính giá</h2>
    <label class="chk"><input type="checkbox" v-model="store.set.use_acc"> Bật phụ kiện/packaging khi tính giá</label>
    <p class="lbl">Dành cho đơn có móc khoá, hộp, túi, nam châm... Khi tắt, trang Tính giá chỉ còn phần in chính và không cộng chi phí phụ kiện.</p></div>
  <div class="card"><h2>{{ cfg.title }}</h2>
    <div class="f"><label v-for="c in cfg.cols" :key="c[0]">{{ c[1] }}
      <NumInput v-if="c[2] === 'number'" v-model="form[c[0]]" :placeholder="c[3]" @keyup.enter="add" />
      <input v-else v-model="form[c[0]]" :placeholder="c[3]" @keyup.enter="add"></label></div>
    <div class="swatches" v-if="isMat"><span class="lbl">Màu</span>
      <button v-for="c in COLORS" :key="c" type="button" class="sw-dot" :class="{ on: form.color === c }" :style="{ background: c }" :aria-label="'Chọn màu ' + c" @click="form.color = c"></button>
      <input type="color" class="clr" v-model="form.color" aria-label="Chọn màu khác"></div>
    <p class="bad" v-if="err">{{ err }}</p>
    <p><button class="btn" @click="add">Thêm</button></p>
    <p class="empty" v-if="!store[kind].length">Chưa có mục nào. Thêm mục đầu tiên ở trên.</p>
    <div class="scroll" v-else><table class="l">
      <thead><tr><th v-for="c in cfg.cols" :key="c[0]">{{ c[1] }}</th><th v-if="isMat">Màu</th><th v-else-if="kind === 'machines'">Khấu hao / giờ</th><th v-else>Giá / cái</th><th></th></tr></thead>
      <tbody><tr v-for="row in store[kind]" :key="row.id">
        <td v-for="c in cfg.cols" :key="c[0]">
          <NumInput v-if="c[2] === 'number'" v-model="row[c[0]]" @change="save(row)" />
          <input v-else v-model="row[c[0]]" @change="save(row)"></td>
        <td v-if="isMat"><input type="color" class="clr" v-model="row.color" aria-label="Màu" @change="save(row)"></td>
        <td v-else-if="kind === 'machines'">{{ fmt(row.life_hours ? row.price / row.life_hours : 0) }}</td>
        <td v-else>{{ fmt(row.pack_qty ? row.pack_price / row.pack_qty : 0) }}</td>
        <td><button class="x" aria-label="Xoá" @click="del(row)">×</button></td></tr></tbody>
    </table></div>
  </div>
</template>