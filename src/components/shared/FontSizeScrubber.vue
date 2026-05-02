<template>
  <input
    v-if="editing"
    ref="inputRef"
    type="text"
    inputmode="numeric"
    class="avnac-font-size-input"
    :value="draft"
    @input="draft = ($event.target as HTMLInputElement).value"
    @keydown.enter.prevent="commitDraft"
    @keydown.escape.prevent="editing = false"
    @blur="commitDraft"
  />
  <div
    v-else
    role="spinbutton"
    :aria-valuenow="Math.round(value)"
    :aria-valuemin="min"
    :aria-valuemax="max"
    class="avnac-font-size-scrubber"
    tabindex="0"
    @dblclick="enterEdit"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown.enter="enterEdit"
  >
    {{ Math.round(value) }}
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'

const props = withDefaults(defineProps<{
  value: number
  min?: number
  max?: number
}>(), { min: 8, max: 800 })

const emit = defineEmits<{ change: [value: number] }>()

const editing = ref(false)
const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const drag = {
  active: false,
  pointerId: -1,
  startX: 0,
  startValue: 0,
}

function clamp(n: number) {
  return Math.round(Math.max(props.min, Math.min(props.max, n)))
}

function enterEdit() {
  draft.value = String(Math.round(props.value))
  editing.value = true
}

watch(editing, async (v) => {
  if (v) {
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  }
})

function commitDraft() {
  const parsed = parseFloat(draft.value.replace(/,/g, ''))
  if (Number.isFinite(parsed)) emit('change', clamp(parsed))
  editing.value = false
}

function onPointerDown(e: PointerEvent) {
  if (editing.value) return
  drag.active = true
  drag.pointerId = e.pointerId
  drag.startX = e.clientX
  drag.startValue = props.value
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!drag.active || e.pointerId !== drag.pointerId) return
  const dx = e.clientX - drag.startX
  if (Math.abs(dx) < 4) return
  const sensitivity = e.shiftKey ? 2 : 0.5
  emit('change', clamp(drag.startValue + dx * sensitivity))
}

function onPointerUp(e: PointerEvent) {
  if (!drag.active || e.pointerId !== drag.pointerId) return
  drag.active = false
  const dx = e.clientX - drag.startX
  if (Math.abs(dx) < 4) enterEdit()
}
</script>

<style scoped>
.avnac-font-size-scrubber {
  min-width: 2.5rem;
  text-align: center;
  cursor: ew-resize;
  font-variant-numeric: tabular-nums;
  padding: 0 4px;
  border-radius: 4px;
  user-select: none;
  color: var(--fg-default, #262626);
  background: transparent;
}
.avnac-font-size-scrubber:hover {
  background: var(--bg-subtle, #f5f5f5);
}
.avnac-font-size-input {
  width: 3.5rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  border: 1px solid var(--border-default, #d4d4d4);
  border-radius: 4px;
  padding: 2px 4px;
  outline: none;
  font-size: inherit;
  background: var(--surface-raised, #fff);
  color: var(--fg-default, #262626);
}
</style>
