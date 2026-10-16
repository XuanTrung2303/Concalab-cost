<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { store, loadAll } from '../store'
const router = useRouter(), email = ref(''), pw = ref(''), msg = ref(''), busy = ref(false)
async function go(signup) {
  busy.value = true; msg.value = ''
  const f = signup ? supabase.auth.signUp : supabase.auth.signInWithPassword
  const { data, error } = await f.call(supabase.auth, { email: email.value, password: pw.value })
  busy.value = false
  if (error) return msg.value = error.message
  if (!data.session) return msg.value = 'Đã tạo tài khoản. Hãy xác nhận email rồi đăng nhập.'
  store.user = data.user; await loadAll(); router.push('/calc')
}
</script>
<template>
  <div class="card login">
    <h1>Concalab-cost</h1>
    <p class="sub">Đăng nhập để lưu nhựa, máy in và chi phí công ty trên mọi thiết bị.</p>
    <label>Email<input v-model="email" type="email" autocomplete="email"></label>
    <label>Mật khẩu<input v-model="pw" type="password" autocomplete="current-password" @keyup.enter="go(false)"></label>
    <p class="bad" v-if="msg">{{ msg }}</p>
    <button class="btn" :disabled="busy" @click="go(false)">Đăng nhập</button>
    <button class="btn g" :disabled="busy" @click="go(true)">Tạo tài khoản</button>
  </div>
</template>
