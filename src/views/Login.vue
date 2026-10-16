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
  busy.value = false
  if (error) return msg.value = error.message === 'Invalid login credentials' ? 'Sai email hoặc mật khẩu' : error.message
  store.user = data.user
  try { await loadAll() } catch (e) { console.error(e) }
  router.push('/calc')
}

// Logo của bạn: để file vào thư mục public/ rồi sửa tên file ở đây nếu khác (png, svg, webp đều được)
const LOGO_LIGHT = '/favicon-conca.svg' // dùng ở chế độ sáng
const LOGO_DARK = '/favicon-conca-1.svg'   // dùng ở chế độ tối
</script>
<template>
  <form class="card login" @submit.prevent="login">
    <div class="logo-wrap"><img :src="dark ? LOGO_DARK : LOGO_LIGHT" alt="Con Cá Lab"></div>
    <h1 class="sr-only">Concalab-cost</h1>
    <p class="sub">Đăng nhập tài khoản quản trị để dùng công cụ.</p>
    <label>Email<input v-model="email" type="email" autocomplete="username"></label>
    <label>Mật khẩu<input v-model="pw" type="password" autocomplete="current-password"></label>
    <p class="bad" v-if="msg">{{ msg }}</p>
    <button class="btn" type="submit" :disabled="busy">Đăng nhập</button>
  </form>
</template>
<style scoped>
.logo-wrap{display:flex;justify-content:center}
.logo-wrap img{display:block;width:170px;max-width:100%;height:auto}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
</style>