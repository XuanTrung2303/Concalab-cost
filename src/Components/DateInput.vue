<script setup>
// Ô chọn ngày hiển thị dạng DD/MM/YYYY (17/10/2026): gõ trực tiếp hoặc bấm biểu tượng lịch để chọn.
// Giá trị bên ngoài là chuỗi YYYY-MM-DD, rỗng khi chưa nhập đủ hoặc nhập sai.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const pad = n => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}` // m tính từ 0
const mask = t => {
  let d = t.replace(/\D/g, '').slice(0, 8)
  if (d.length === 1 && d > '3') d = '0' + d
  if (d.length === 3 && d[2] > '1') d = d.slice(0, 2) + '0' + d[2]
  return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}
const parse = t => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t); if (!m) return ''
  const d = +m[1], mo = +m[2], y = +m[3], dt = new Date(y, mo - 1, d)
  return y >= 1900 && dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? iso(y, mo - 1, d) : ''
}
const disp = v => v ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : ''

const today = new Date(), todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate())
const txt = ref(disp(props.modelValue)), open = ref(false), root = ref(null)
const vy = ref(today.getFullYear()), vm = ref(today.getMonth())
watch(() => props.modelValue, v => { if (parse(txt.value) !== v) txt.value = disp(v) })
const cur = () => parse(txt.value) || props.modelValue
const cells = computed(() => {
  const lead = (new Date(vy.value, vm.value, 1).getDay() + 6) % 7 // tuần bắt đầu từ thứ Hai
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(vy.value, vm.value, 1 - lead + i), v = iso(d.getFullYear(), d.getMonth(), d.getDate())
    return { v, day: d.getDate(), other: d.getMonth() !== vm.value, today: v === todayIso, sel: v === cur() }
  })
})
function onInput(e) {
  txt.value = e.target.value = mask(e.target.value)
  const v = parse(txt.value)
  if (v !== props.modelValue) emit('update:modelValue', v)
}
// Rời ô mà đang nhập dở: nếu trước đó đã có ngày hợp lệ thì trả về ngày đó
function fix() { if (!parse(txt.value) && props.modelValue) txt.value = disp(props.modelValue) }
function move(dm) { const d = new Date(vy.value, vm.value + dm, 1); vy.value = d.getFullYear(); vm.value = d.getMonth() }
function toggle() {
  open.value = !open.value
  if (!open.value) return
  const v = cur()
  vy.value = v ? +v.slice(0, 4) : today.getFullYear(); vm.value = v ? +v.slice(5, 7) - 1 : today.getMonth()
}
function pick(v) { txt.value = disp(v); emit('update:modelValue', v); open.value = false }
const away = e => { if (open.value && root.value && !root.value.contains(e.target)) open.value = false }
onMounted(() => document.addEventListener('click', away))
onBeforeUnmount(() => document.removeEventListener('click', away))
</script>
<template>
  <div class="di" ref="root" @keydown.esc="open = false">
    <input :value="txt" inputmode="numeric" maxlength="10" placeholder="17/10/2026" aria-label="Ngày (DD/MM/YYYY)" @input="onInput" @blur="fix">
    <button type="button" class="cal" aria-label="Chọn ngày từ lịch" :aria-expanded="open" @click="toggle">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    </button>
    <div v-if="open" class="pop" role="dialog" aria-label="Chọn ngày">
      <div class="nav">
        <button type="button" aria-label="Năm trước" @click="move(-12)">«</button>
        <button type="button" aria-label="Tháng trước" @click="move(-1)">‹</button>
        <b>Tháng {{ vm + 1 }}/{{ vy }}</b>
        <button type="button" aria-label="Tháng sau" @click="move(1)">›</button>
        <button type="button" aria-label="Năm sau" @click="move(12)">»</button>
      </div>
      <div class="days">
        <span v-for="w in ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']" :key="w" class="wd">{{ w }}</span>
        <button v-for="c in cells" :key="c.v" type="button" :class="{ other: c.other, today: c.today, on: c.sel }" :aria-label="disp(c.v)" :aria-pressed="c.sel" @click="pick(c.v)">{{ c.day }}</button>
      </div>
      <div class="foot"><button type="button" @click="pick(todayIso)">Hôm nay</button></div>
    </div>
  </div>
</template>
<style scoped>
.di{position:relative;min-width:0}
.di input{margin:0;padding-right:36px}
.cal{position:absolute;top:0;bottom:0;right:2px;width:34px;display:flex;align-items:center;justify-content:center;background:none;border:0;color:var(--mut);cursor:pointer;border-radius:8px}
.cal:hover{color:var(--ink)}
.pop{position:absolute;z-index:20;top:calc(100% + 6px);left:0;width:272px;background:var(--card);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px #0003;padding:10px}
.nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;color:var(--ink);font-size:14px}
.nav button{background:none;border:1px solid var(--line);border-radius:6px;width:30px;height:28px;color:var(--ink);cursor:pointer;font-size:16px;line-height:1}
.days{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.wd{text-align:center;font-size:12px;color:var(--mut);padding:4px 0}
.days button{height:34px;border:0;border-radius:6px;background:none;color:var(--ink);font:inherit;cursor:pointer}
.days button:hover:not(.on){background:var(--acc2)}
.days .other{color:var(--mut);opacity:.55}
.days .today{box-shadow:inset 0 0 0 1px var(--acc)}
.days .on{background:var(--acc);color:#fff;opacity:1}
.foot{display:flex;justify-content:flex-end;margin-top:8px}
.foot button{background:none;border:0;color:var(--link);font:inherit;font-weight:600;cursor:pointer;padding:4px 6px}
</style>