<script setup>
import { store } from '../store'
const s = store.set
</script>
<template>
  <div class="card"><h2>Cài đặt chung</h2><div class="f">
    <label>Giá điện (đ/kWh)<input v-model.number="s.elec" type="number" min="0"></label>
    <label>Lương giờ (đ)<input v-model.number="s.wage" type="number" min="0"></label>
    <label>Dự phòng in hỏng (%)<input v-model.number="s.fail" type="number" min="0" step=".1"></label>
    <label>Cách tính lợi nhuận<select v-model="s.mode"><option value="markup">Markup: lãi trên giá vốn</option><option value="margin">Margin: lãi trên giá bán</option></select></label>
    <label>Tỷ lệ lợi nhuận (%)<input v-model.number="s.profit" type="number" min="0" max="95" step=".1"></label>
    <label>Chi phí công ty phân bổ / sản phẩm (đ)<input v-model.number="s.ovh" type="number" min="0"></label>
  </div><p class="note">Mức phân bổ có thể lấy tự động từ trang <router-link to="/company">Chi phí công ty</router-link>. Cài đặt tự lưu lên Supabase.</p></div>
</template>
