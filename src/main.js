import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Login from './views/Login.vue'
import Calc from './views/Calc.vue'
import Library from './views/Library.vue'
import Settings from './views/Settings.vue'
import Company from './views/Company.vue'
import Products from './views/Products.vue'
import { supabase } from './supabase'
import { store, loadAll } from './store'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/calc' },
    { path: '/login', component: Login },
    { path: '/calc', component: Calc },
    { path: '/products', component: Products },
    { path: '/materials', component: Library, props: { kind: 'materials' } },
    { path: '/machines', component: Library, props: { kind: 'machines' } },
    { path: '/settings', component: Settings },
    { path: '/company', component: Company }
  ]
})
router.beforeEach(to => { if (!store.user && to.path !== '/login') return '/login' })

const { data: { session } } = await supabase.auth.getSession()
if (session) { store.user = session.user; await loadAll() }
createApp(App).use(router).mount('#app')