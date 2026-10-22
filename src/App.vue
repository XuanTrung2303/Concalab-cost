<script setup>
import { useRoute, useRouter } from 'vue-router'
import { store, loadAll } from './store'
import { supabase } from './supabase'
import { h } from 'vue'
import { dark, toggleTheme } from './theme.js'
// Biểu tượng mặt trời (đang tối, bấm để sáng) và mặt trăng (đang sáng, bấm để tối)
const Icon = p => h('svg', { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' },
  p.dark ? [h('circle', { cx: 12, cy: 12, r: 4 }), h('path', { d: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41' })]
         : [h('path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' })])
const route = useRoute(), router = useRouter()
const tabs = [['/calc', 'Tính giá'], ['/products', 'Sản phẩm'], ['/materials', 'Nhựa'], ['/machines', 'Máy in'], ['/accessories', 'Phụ kiện'], ['/settings', 'Cài đặt']]
async function logout() { await supabase.auth.signOut(); store.user = null; router.push('/login') }
</script>
<template>
  <header v-if="store.user"><div class="bar">
    <router-link class="brand" to="/calc">Conca<i>lab</i></router-link>
    <nav class="sw">
      <router-link to="/calc" active-class="" :class="{ on: !['/company', '/capital', '/fund'].includes(route.path) }">Giá in 3D</router-link>
      <router-link to="/company" active-class="on">Chi phí công ty</router-link>
      <router-link to="/capital" active-class="on">Vốn công ty</router-link>
      <router-link to="/fund" active-class="on">Quỹ công ty</router-link>
    </nav>
    <button class="out ico" :title="dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'" :aria-label="dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'" @click="toggleTheme"><Icon :dark="dark" /></button>
    <button class="out" @click="logout">Đăng xuất</button>
  </div></header>
  <button v-else class="tgl ico" :title="dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'" :aria-label="dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'" @click="toggleTheme"><Icon :dark="dark" /></button>
  <main>
    <div class="tabs" v-if="store.user && !['/company', '/capital', '/fund'].includes(route.path)">
      <router-link v-for="t in tabs" :key="t[0]" :to="t[0]" active-class="on">{{ t[1] }}</router-link>
    </div>
    <div v-if="store.user && store.loading" class="wait" role="status"><span class="spin" aria-hidden="true"></span>Đang tải dữ liệu...</div>
    <div v-else-if="store.user && store.loadError" class="card">
      <p class="bad">Không tải được dữ liệu: {{ store.loadError }}</p>
      <button class="btn" @click="loadAll">Thử lại</button></div>
    <router-view v-else :key="route.path" />
  </main>
</template>
<style scoped>
.ico{display:inline-flex;align-items:center;justify-content:center;padding:7px;line-height:0}
.wait{display:flex;align-items:center;justify-content:center;gap:12px;padding:80px 0;color:var(--mut)}
.spin{width:18px;height:18px;border:2px solid var(--line);border-top-color:var(--acc);border-radius:50%;animation:turn .7s linear infinite}
@keyframes turn{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.spin{animation-duration:2s}}
@media(max-width:720px){.sw{margin-left:0;width:100%}.sw a{flex:1;text-align:center;padding:7px 6px;font-size:13px}}
</style>