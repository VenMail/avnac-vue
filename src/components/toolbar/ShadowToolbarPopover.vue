<template>
  <div ref="rootRef" class="relative">
    <button class="avnac-toolbar-btn" title="Shadow" @click="toggle">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="14" height="14" rx="2"/>
        <rect x="7" y="7" width="14" height="14" rx="2" stroke-opacity="0.3"/>
      </svg>
      <span class="text-xs ml-1">{{ shadowActive ? value.blur : '—' }}</span>
    </button>
    <div
      v-if="open"
      ref="panelRef"
      class="absolute z-50 avnac-popover"
      :class="openUpward ? 'bottom-full mb-2' : 'top-full mt-2'"
      :style="{ transform: `translateX(calc(-50% + ${shiftX}px))`, left: '50%' }"
    >
      <div v-for="row in ROWS" :key="row.key" class="flex items-center gap-2 mb-2">
        <label class="text-xs text-[var(--fg-subtle,#737373)] w-16">{{ row.label }}</label>
        <EditorRangeSlider :value="localVal(row.key)" :min="row.min" :max="row.max" @change="updateField(row.key, $event)" />
        <span class="text-xs font-mono w-8 text-right">{{ localVal(row.key) }}</span>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-[var(--fg-subtle,#737373)] w-16">Color</label>
        <input
          type="color"
          :value="value.colorHex"
          class="w-7 h-7 rounded cursor-pointer border border-[var(--border-default,#e0e0e0)]"
          @input="updateColor"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FabricShadowUi } from '#/lib/avnac-fabric-shadow'
import { useViewportPopover, useClickOutside } from '#/composables/useViewportPopover'
import EditorRangeSlider from '#/components/shared/EditorRangeSlider.vue'

const props = defineProps<{
  value: FabricShadowUi
  shadowActive: boolean
}>()
const emit = defineEmits<{ change: [v: FabricShadowUi] }>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const { openUpward, shiftX, update } = useViewportPopover(200)
const { attach, detach } = useClickOutside(() => [rootRef.value, panelRef.value], () => { open.value = false })

const ROWS = [
  { key: 'blur', label: 'Blur', min: 0, max: 50 },
  { key: 'offsetX', label: 'Offset X', min: -40, max: 40 },
  { key: 'offsetY', label: 'Offset Y', min: -40, max: 40 },
  { key: 'opacityPct', label: 'Opacity', min: 0, max: 100 },
] as const

function localVal(key: keyof FabricShadowUi): number {
  const v = props.value[key]
  return typeof v === 'number' ? Math.round(v) : 0
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    attach()
    requestAnimationFrame(() => update(rootRef.value, panelRef.value))
  } else {
    detach()
  }
}

function updateField(key: keyof FabricShadowUi, val: number) {
  emit('change', { ...props.value, [key]: val })
}

function updateColor(e: Event) {
  const hex = (e.target as HTMLInputElement).value
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) emit('change', { ...props.value, colorHex: hex })
}
</script>

<style scoped>
.avnac-toolbar-btn {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 6px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--fg-default, #262626);
}
.avnac-toolbar-btn:hover { background: var(--bg-subtle, #f0f0f0); }
.avnac-popover {
  background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 12px 14px;
  min-width: 220px;
}
</style>
