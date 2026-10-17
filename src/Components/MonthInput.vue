<script setup>
// Ô chọn tháng hiển thị dạng MM/YYYY (10/2026): gõ trực tiếp hoặc bấm biểu tượng lịch để chọn.
// Giá trị bên ngoài là chuỗi YYYY-MM, rỗng khi chưa nhập đủ hoặc nhập sai.
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const mask = t => { let d = t.replace(/\D/g, '').slice(0, 6); if (d.length === 1 && d > '1') d = '0' + d; return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d }
const parse = t => { const m = /^(\d{2})\/(\d{4})$/.exec(t); return m && +m[1] >= 1 && +m[1] <= 12 ? `${m[2]}-${m[1]}` : '' }
const disp = ym => ym ? ym.slice(5, 7) + '/' + ym.slice(0, 4) : ''
const txt = ref(disp(props.modelValue)), open = ref(false), year = ref(new Date().getFullYear()), root = ref(null)
watch(() => props.modelValue, v => { if (parse(txt.value) !== v) txt.value = disp(v) })
function onInput(e) {
  txt.value = e.target.value = mask(e.target.value)
  const v = parse(txt.value)
  if (v !== props.modelValue) emit('update:modelValue', v)
}
// Rời ô mà đang nhập dở: nếu đã có tháng hợp lệ trước đó thì trả về tháng đó
function fix() { if (!parse(txt.value) && props.modelValue) txt.value = disp(props.modelValue) }
function toggle() {
  open.value = !open.value
  if (open.value) year.value = +(parse(txt.value) || props.modelValue || String(new Date().getFullYear())).slice(0, 4)
}
const isSel = m => (parse(txt.value) || props.modelValue) === `${year.value}-${String(m).padStart(2, '0')}`
function pick(m) {
  const v = `${year.value}-${String(m).padStart(2, '0')}`
  txt.value = disp(v); emit('update:modelValue', v); open.value = false
}
const away = e => { if (open.value && root.value && !root.value.contains(e.target)) open.value = false }
onMounted(() => document.addEventListener('click', away))
onBeforeUnmount(() => document.removeEventListener('click', away))
</script>
<template>
  <div class="mi" ref="root" @keydown.esc="open = false">
    <input :value="txt" inputmode="numeric" maxlength="7" placeholder="10/2026" aria-label="Tháng (MM/YYYY)" @input="onInput" @blur="fix">
    <button type="button" class="cal" aria-label="Chọn tháng từ lịch" :aria-expanded="open" @click="toggle">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    </button>
    <div v-if="open" class="pop" role="dialog" aria-label="Chọn tháng">
      <div class="yr">
        <button type="button" aria-label="Năm trước" @click="year--">‹</button><b>{{ year }}</b><button type="button" aria-label="Năm sau" @click="year++">›</button>
      </div>
      <div class="months">
        <button v-for="m in 12" :key="m" type="button" :class="{ on: isSel(m) }" @click="pick(m)">T{{ m }}</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.mi{position:relative;min-width:0}
.mi input{margin:0;padding-right:36px}
.cal{position:absolute;top:0;bottom:0;right:2px;width:34px;display:flex;align-items:center;justify-content:center;background:none;border:0;color:var(--mut);cursor:pointer;border-radius:8px}
.cal:hover{color:var(--ink)}
.pop{position:absolute;z-index:20;top:calc(100% + 6px);left:0;width:240px;background:var(--card);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px #0003;padding:10px}
.yr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;color:var(--ink)}
.yr button{background:none;border:1px solid var(--line);border-radius:6px;width:32px;height:28px;color:var(--ink);cursor:pointer;font-size:16px;line-height:1}
.months{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.months button{padding:8px 0;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink);font:inherit;cursor:pointer}
.months button:hover:not(.on){background:var(--acc2)}
.months button.on{background:var(--acc);color:#fff;border-color:var(--acc)}
</style>