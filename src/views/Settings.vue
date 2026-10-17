<script setup>
import { computed } from 'vue'
import { store } from '../store'
import { fmt } from '../util'
const s = store.set
// Ví dụ minh hoạ với giá vốn 10.000đ để dễ hình dung hai cách tính
const example = computed(() => { const p = Math.min(+s.profit || 0, 95) / 100; return 10000 * (s.mode === 'margin' ? 1 / (1 - p) : 1 + p) })
</script>
<template>
  <div class="card"><h2>Chi phí sản xuất</h2><div class="f">
    <label>Giá điện (đ/kWh)<NumInput v-model="s.elec" /></label>
    <label>Lương giờ (đ)<NumInput v-model="s.wage" /></label>
    <label>Dự phòng in hỏng (%)<NumInput v-model="s.fail" /></label>
  </div></div>
  <div class="card"><h2>Lợi nhuận</h2><div class="f">
    <div><div class="lbl" id="mode-label">Cách tính lợi nhuận</div>
      <div class="sw lt mode" role="group" aria-labelledby="mode-label">
        <button type="button" :class="{ on: s.mode === 'markup' }" @click="s.mode = 'markup'">Markup</button>
        <button type="button" :class="{ on: s.mode === 'margin' }" @click="s.mode = 'margin'">Margin</button></div></div>
    <label>Tỷ lệ lợi nhuận (%)<NumInput v-model="s.profit" /></label>
  </div>
  <p class="note hint">{{ s.mode === 'margin' ? 'Margin: tỷ lệ tính trên giá bán. Giá bán = giá vốn ÷ (1 − tỷ lệ).' : 'Markup: tỷ lệ tính trên giá vốn. Giá bán = giá vốn × (1 + tỷ lệ).' }}
    Ví dụ: giá vốn 10.000đ, tỷ lệ {{ s.profit || 0 }}% thì giá bán là <b>{{ fmt(example) }}</b>.</p></div>
</template>
<style scoped>
.mode{width:fit-content;margin:6px 0 0}
.hint{margin:14px 0 0}
</style>