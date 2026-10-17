export const fmt = n => Math.round(n || 0).toLocaleString('vi-VN') + 'đ'
// Tính giá cho 1 khay in. gram, thời gian in, công xử lý là của cả khay.
export function compute(st) {
  const c = st.calc, s = st.set
  const m = st.machines.find(x => x.id === c.machine), t = st.materials.find(x => x.id === c.material)
  const hrs = c.h + c.min / 60, q = Math.max(1, c.qty), fee = Math.min(c.fee, 90) / 100
  const mat = c.gram * (t?.price_kg || 0) / 1000
  const elec = hrs * (m?.kw || 0) * s.elec
  const dep = m?.life_hours ? hrs * m.price / m.life_hours : 0
  const labor = c.handle / 60 * s.wage
  // Phụ kiện: số lượng nhập là cho mỗi sản phẩm; tắt phụ kiện thì không tính
  const accUnit = s.use_acc === false ? 0 : (c.acc || []).reduce((a, x) => {
    const p = st.accessories.find(y => y.id === x.id)
    return a + (p && p.pack_qty ? p.pack_price / p.pack_qty * (+x.qty || 0) : 0)
  }, 0)
  const accTray = accUnit * q
  // Dự phòng in hỏng = tỷ lệ trong Cài đặt × toàn bộ chi phí còn lại (sub)
  const sub = mat + elec + dep + labor + c.other + accTray
  const risk = sub * s.fail / 100
  const batch = sub + risk
  const direct = batch / q, unit = direct
  const p = Math.min(s.profit, 95) / 100
  const base = s.mode === 'margin' ? unit / (1 - p) : unit * (1 + p)
  const price = (base + c.fixed) / (1 - fee)
  const profit = price * (1 - fee) - c.fixed - unit
  return { q, m, t, mat, elec, dep, risk, labor, accUnit, accTray, sub, batch, direct, unit, price, profit }
}