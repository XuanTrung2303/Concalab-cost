<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { store, loadAll } from '../store'
const router = useRouter(), email = ref(''), pw = ref(''), msg = ref(''), busy = ref(false)
async function login() {
  msg.value = ''
  if (!email.value.trim() || !pw.value) return msg.value = 'Hãy nhập email và mật khẩu'
  busy.value = true
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: pw.value })
  busy.value = false
  if (error) return msg.value = error.message === 'Invalid login credentials' ? 'Sai email hoặc mật khẩu' : error.message
  store.user = data.user; await loadAll(); router.push('/calc')
}
</script>
<template>
  <form class="card login" @submit.prevent="login">
    <h1>Concalab-cost</h1>
    <p class="sub">Đăng nhập tài khoản quản trị để dùng công cụ.</p>
    <label>Email<input v-model="email" type="email" autocomplete="username"></label>
    <label>Mật khẩu<input v-model="pw" type="password" autocomplete="current-password"></label>
    <p class="bad" v-if="msg">{{ msg }}</p>
    <button class="btn" type="submit" :disabled="busy">Đăng nhập</button>
  </form>
</template>