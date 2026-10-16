<script setup>
// Ô nhập số có dấu phân cách hàng nghìn: 125000 -> 125,000. Vẫn cho nhập số thập phân (0.15).
import { ref, watch } from 'vue'
const props = defineProps({ modelValue: { type: [Number, String], default: null } })
const emit = defineEmits(['update:modelValue'])
const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const show = v => { if (v === null || v === undefined || v === '') return ''; const [i, d] = String(v).split('.'); return group(i) + (d !== undefined ? '.' + d : '') }
const parse = t => parseFloat(String(t).replace(/,/g, '')) || 0
const txt = ref(show(props.modelValue))
watch(() => props.modelValue, v => { if (parse(txt.value) !== (+v || 0)) txt.value = show(v) })
function onInput(e) {
  let t = e.target.value.replace(/[^\d.]/g, '')
  const k = t.indexOf('.')
  if (k >= 0) t = t.slice(0, k + 1) + t.slice(k + 1).replace(/\./g, '')
  const [i, d] = t.split('.')
  txt.value = group(i.replace(/^0+(?=\d)/, '')) + (d !== undefined ? '.' + d : '')
  e.target.value = txt.value
  emit('update:modelValue', parseFloat(t) || 0)
}
</script>
<template><input :value="txt" inputmode="decimal" autocomplete="off" @input="onInput"></template>