<script setup>
import { useRoute, useRouter } from 'vue-router'
import { store } from './store'
import { supabase } from './supabase'
import { dark, toggleTheme } from './theme'
const route = useRoute(), router = useRouter()
const tabs = [['/calc', 'Tính giá'], ['/products', 'Sản phẩm'], ['/materials', 'Nhựa'], ['/machines', 'Máy in'], ['/accessories', 'Phụ kiện'], ['/settings', 'Cài đặt']]
async function logout() { await supabase.auth.signOut(); store.user = null; router.push('/login') }
</script>
<template>
  <header v-if="store.user"><div class="bar">
    <router-link class="brand" to="/calc">Conca<i>lab</i></router-link>
    <nav class="sw">
      <router-link to="/calc" active-class="" :class="{ on: route.path !== '/company' }">Giá in 3D</router-link>
      <router-link to="/company" active-class="on">Chi phí công ty</router-link>
    </nav>
    <button class="out" @click="toggleTheme">{{ dark ? 'Chế độ sáng' : 'Chế độ tối' }}</button>
    <button class="out" @click="logout">Đăng xuất</button>
  </div></header>
  <button v-else class="tgl" @click="toggleTheme">{{ dark ? 'Chế độ sáng' : 'Chế độ tối' }}</button>
  <main>
    <div class="tabs" v-if="store.user && route.path !== '/company'">
      <router-link v-for="t in tabs" :key="t[0]" :to="t[0]" active-class="on">{{ t[1] }}</router-link>
    </div>
    <router-view :key="route.path" />
  </main>
</template>