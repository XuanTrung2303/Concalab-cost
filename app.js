import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }))
app.use(express.json())
app.get('/health', (_, res) => res.json({ ok: true }))

// Xác thực: mỗi request dùng đúng JWT của người dùng -> RLS của Supabase tự lọc dữ liệu theo user
app.use('/api', async (req, res, next) => {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' })
  const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false }
  })
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn' })
  req.sb = sb; req.uid = data.user.id; next()
})

const reply = (res, { data, error }) => error ? res.status(400).json({ error: error.message }) : res.json(data)
const pick = (b, fields) => Object.fromEntries(fields.filter(f => b[f] !== undefined).map(f => [f, b[f]]))

function crud(path, table, fields) {
  app.get(`/api/${path}`, async (req, res) => reply(res, await req.sb.from(table).select('*').order('created_at')))
  app.post(`/api/${path}`, async (req, res) =>
    reply(res, await req.sb.from(table).insert({ ...pick(req.body, fields), user_id: req.uid }).select().single()))
  app.put(`/api/${path}/:id`, async (req, res) =>
    reply(res, await req.sb.from(table).update(pick(req.body, fields)).eq('id', req.params.id).select().single()))
  app.delete(`/api/${path}/:id`, async (req, res) => {
    const { error } = await req.sb.from(table).delete().eq('id', req.params.id)
    error ? res.status(400).json({ error: error.message }) : res.json({ ok: true })
  })
}
crud('materials', 'materials', ['name', 'type', 'price_kg', 'color'])
crud('machines', 'machines', ['name', 'kw', 'life_hours', 'price'])
crud('company-costs', 'company_costs', ['name', 'amount', 'spent_on'])
crud('sales', 'company_sales', ['sold_on', 'name', 'revenue', 'cogs'])
crud('accessories', 'accessories', ['name', 'grp', 'pack_qty', 'pack_price'])
crud('capital', 'company_capital', ['kind', 'entry_date', 'name', 'amount'])
crud('products', 'products', ['name', 'sku', 'inputs', 'unit_cost', 'price', 'profit'])

// Một lần gọi cho toàn bộ dữ liệu: chỉ xác thực một lần thay vì tám lần, đăng nhập xong vào app nhanh hơn nhiều
app.get('/api/bootstrap', async (req, res) => {
  const q = t => req.sb.from(t).select('*').order('created_at')
  const r = await Promise.all([q('materials'), q('machines'), q('company_costs'), q('products'), q('company_sales'), q('accessories'), q('company_capital'), req.sb.from('settings').select('*').maybeSingle()])
  const bad = r.find(x => x.error)
  if (bad) return res.status(400).json({ error: bad.error.message })
  const [materials, machines, costs, products, sales, accessories, capital, settings] = r.map(x => x.data)
  res.json({ materials, machines, costs, products, sales, accessories, capital, settings: settings || {} })
})

const SET = ['elec', 'wage', 'fail', 'mode', 'profit', 'ovh', 'units', 'var_cost', 'avg_price', 'use_acc']
app.get('/api/settings', async (req, res) => reply(res, await req.sb.from('settings').select('*').maybeSingle().then(r => ({ ...r, data: r.data || {} }))))
app.put('/api/settings', async (req, res) =>
  reply(res, await req.sb.from('settings').upsert({ ...pick(req.body, SET), user_id: req.uid }, { onConflict: 'user_id' }).select().single()))

app.use('/api', (req, res) => res.status(404).json({ error: 'Không tìm thấy API' }))

export default app