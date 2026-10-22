import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Login from './views/Login.vue'
import Calc from './views/Calc.vue'
import Library from './views/Library.vue'
import Settings from './views/Settings.vue'
import Company from './views/Company.vue'
import Products from './views/Products.vue'
import Capital from './views/Capital.vue'
import Fund from './views/Fund.vue'
import { supabase, configured } from './supabase'
import { store, loadAll } from './store'
import NumInput from './Components/NumInput.vue'
import { applyTheme } from './theme.js'
import './style.css'

applyTheme()
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/calc' },
    { path: '/login', component: Login },
    { path: '/calc', component: Calc },
    { path: '/products', component: Products },
    { path: '/materials', component: Library, props: { kind: 'materials' } },
    { path: '/machines', component: Library, props: { kind: 'machines' } },
    { path: '/accessories', component: Library, props: { kind: 'accessories' } },
    { path: '/settings', component: Settings },
    { path: '/company', component: Company },
    { path: '/capital', component: Capital },
    { path: '/fund', component: Fund }
  ]
})
router.beforeEach(to => {
  if (!store.user && to.path !== '/login') return '/login'
  if (store.user && to.path === '/login') return '/calc'
})

if (!configured) {
  document.getElementById('app').innerHTML = '<p style="max-width:520px;margin:60px auto;padding:0 16px;font:15px/1.6 system-ui">Thiếu cấu hình Supabase. Hãy thêm biến môi trường <b>VITE_SUPABASE_URL</b> và <b>VITE_SUPABASE_ANON_KEY</b>, rồi build lại.</p>'
} else {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) { store.user = session.user; loadAll() } // tải nền, giao diện hiện ngay và có màn hình chờ
  createApp(App).use(router).component('NumInput', NumInput).mount('#app')
}