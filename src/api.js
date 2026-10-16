import { supabase } from './supabase'
const base = ''
export async function api(path, method = 'GET', body) {
  const { data: { session } } = await supabase.auth.getSession()
  const r = await fetch(`${base}/api/${path}`, {
    method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'Có lỗi xảy ra')
  return j
}
