<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { store, loadAll } from '../store'
import { dark } from '../theme'
const router = useRouter(), email = ref(''), pw = ref(''), msg = ref(''), busy = ref(false)
async function login() {
  msg.value = ''
  if (!email.value.trim() || !pw.value) return msg.value = 'Hãy nhập email và mật khẩu'
  busy.value = true
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: pw.value })
  if (error) { busy.value = false; return msg.value = error.message === 'Invalid login credentials' ? 'Sai email hoặc mật khẩu' : error.message }
  store.user = data.user
  loadAll() // tải nền; App.vue hiện màn hình chờ trong lúc này
  router.push('/calc')
}

// Logo của bạn: để file vào thư mục public/ rồi sửa tên file ở đây nếu khác (png, svg, webp đều được)
const LOGO_LIGHT = '/logo-light.png' // dùng ở chế độ sáng
const LOGO_DARK = '/logo-dark.png'   // dùng ở chế độ tối
</script>
<template>
  <form class="card login" @submit.prevent="login">
    <div class="logo-wrap"><img :src="dark ? LOGO_DARK : LOGO_LIGHT" alt="Con Cá Lab"></div>
    <h1 class="sr-only">Concalab-cost</h1>
    <p class="sub">Đăng nhập tài khoản quản trị để dùng công cụ.</p>
    <label>Email<input v-model="email" type="email" autocomplete="username" :disabled="busy"></label>
    <label>Mật khẩu<input v-model="pw" type="password" autocomplete="current-password" :disabled="busy"></label>
    <p class="bad" v-if="msg" role="alert">{{ msg }}</p>
    <button class="btn" type="submit" :disabled="busy"><span v-if="busy" class="spin" aria-hidden="true"></span>{{ busy ? 'Đang đăng nhập...' : 'Đăng nhập' }}</button>
  </form>
</template>
<style scoped>
.logo-wrap{display:flex;justify-content:center}
.logo-wrap img{display:block;width:170px;max-width:100%;height:auto}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.btn:disabled{opacity:.85;cursor:progress}
.spin{display:inline-block;width:14px;height:14px;border:2px solid #ffffff66;border-top-color:#fff;border-radius:50%;animation:turn .7s linear infinite;vertical-align:-2px;margin-right:8px}
@keyframes turn{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.spin{animation-duration:2s}}
</style>