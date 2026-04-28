<template>
  <div class="avnac-bg-popover" ref="panelRef">
    <!-- Tabs -->
    <div class="flex border-b border-[var(--border-default,#e0e0e0)] mb-3">
      <button
        v-for="tab in ['solid', 'gradient']"
        :key="tab"
        class="flex-1 py-1.5 text-xs font-medium capitalize transition-colors"
        :class="activeTab === tab ? 'border-b-2 border-[var(--fg-default,#262626)] -mb-px' : 'text-[var(--fg-subtle,#737373)]'"
        @click="activeTab = tab as 'solid' | 'gradient'"
      >{{ tab }}</button>
    </div>

    <!-- Solid tab -->
    <template v-if="activeTab === 'solid'">
      <div class="grid grid-cols-6 gap-2 mb-3">
        <button
          v-for="hex in PRESET_SOLIDS"
          :key="hex"
          class="w-7 h-7 rounded-md border border-[var(--border-default,#e0e0e0)] transition-transform hover:scale-110"
          :style="swatchStyle(hex)"
          :title="hex"
          @click="applySolid(hex)"
        />
      </div>
      <div class="flex gap-2 items-center">
        <input
          type="color"
          :value="solidHex"
          class="w-8 h-8 rounded cursor-pointer border border-[var(--border-default,#e0e0e0)]"
          @input="onColorPickerInput"
        />
        <input
          type="text"
          :value="solidHexDisplay"
          class="flex-1 text-xs border border-[var(--border-default,#e0e0e0)] rounded px-2 py-1 outline-none"
          placeholder="#000000"
          @input="onHexInput"
          @blur="onHexBlur"
        />
      </div>
    </template>

    <!-- Gradient tab -->
    <template v-else>
      <div class="grid grid-cols-4 gap-2 mb-3">
        <button
          v-for="(g, i) in PRESET_GRADIENTS"
          :key="i"
          class="w-12 h-8 rounded-md border border-[var(--border-default,#e0e0e0)] transition-transform hover:scale-110"
          :style="{ backgroundImage: gradientCss(g.stops, g.angle) }"
          @click="applyGradient(g.stops, g.angle)"
        />
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex gap-2 items-center">
          <label class="text-xs text-[var(--fg-subtle,#737373)] w-16">Start</label>
          <input type="color" :value="gradStart" class="w-7 h-7 rounded cursor-pointer border border-[var(--border-default,#e0e0e0)]" @input="e => { gradStart = (e.target as HTMLInputElement).value; emitGradient() }" />
          <input type="text" :value="gradStart" class="flex-1 text-xs border border-[var(--border-default,#e0e0e0)] rounded px-2 py-1 outline-none" @change="e => { const v = parseHex((e.target as HTMLInputElement).value); if (v) { gradStart = v; emitGradient() } }" />
        </div>
        <div class="flex gap-2 items-center">
          <label class="text-xs text-[var(--fg-subtle,#737373)] w-16">End</label>
          <input type="color" :value="gradEnd" class="w-7 h-7 rounded cursor-pointer border border-[var(--border-default,#e0e0e0)]" @input="e => { gradEnd = (e.target as HTMLInputElement).value; emitGradient() }" />
          <input type="text" :value="gradEnd" class="flex-1 text-xs border border-[var(--border-default,#e0e0e0)] rounded px-2 py-1 outline-none" @change="e => { const v = parseHex((e.target as HTMLInputElement).value); if (v) { gradEnd = v; emitGradient() } }" />
        </div>
        <div class="flex gap-2 items-center">
          <label class="text-xs text-[var(--fg-subtle,#737373)] w-16">Angle</label>
          <input type="range" min="0" max="360" :value="gradAngle" class="flex-1" @input="e => { gradAngle = Number((e.target as HTMLInputElement).value); emitGradient() }" />
          <input type="text" :value="gradAngle" class="w-12 text-xs border border-[var(--border-default,#e0e0e0)] rounded px-2 py-1 outline-none" @change="e => { const n = parseInt((e.target as HTMLInputElement).value, 10); if (Number.isFinite(n)) { gradAngle = clampAngle(n); emitGradient() } }" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BgValue, GradientStop } from '#/lib/bg-value'
import { bgValueToCss, isTransparentCssColor } from '#/lib/bg-value'

const props = defineProps<{ value: BgValue }>()
const emit = defineEmits<{ change: [v: BgValue] }>()

const panelRef = ref<HTMLElement | null>(null)
defineExpose({ panelRef })

const PRESET_SOLIDS = [
  'transparent','#ffffff','#f8f9fa','#f1f3f5','#e9ecef','#dee2e6',
  '#212529','#0c8ce9','#339af0','#51cf66','#fcc419','#ff922b',
  '#ff6b6b','#cc5de8','#845ef7','#5c7cfa','#22b8cf','#20c997','#94d82d',
]

const PRESET_GRADIENTS: { stops: GradientStop[]; angle: number }[] = [
  { stops: [{ color: '#667eea', offset: 0 }, { color: '#764ba2', offset: 1 }], angle: 135 },
  { stops: [{ color: '#f093fb', offset: 0 }, { color: '#f5576c', offset: 1 }], angle: 135 },
  { stops: [{ color: '#4facfe', offset: 0 }, { color: '#00f2fe', offset: 1 }], angle: 135 },
  { stops: [{ color: '#43e97b', offset: 0 }, { color: '#38f9d7', offset: 1 }], angle: 135 },
  { stops: [{ color: '#fa709a', offset: 0 }, { color: '#fee140', offset: 1 }], angle: 135 },
  { stops: [{ color: '#a18cd1', offset: 0 }, { color: '#fbc2eb', offset: 1 }], angle: 135 },
  { stops: [{ color: '#fccb90', offset: 0 }, { color: '#d57eeb', offset: 1 }], angle: 135 },
  { stops: [{ color: '#e0c3fc', offset: 0 }, { color: '#8ec5fc', offset: 1 }], angle: 135 },
  { stops: [{ color: '#f5f7fa', offset: 0 }, { color: '#c3cfe2', offset: 1 }], angle: 135 },
  { stops: [{ color: '#0c0c0c', offset: 0 }, { color: '#3a3a3a', offset: 1 }], angle: 135 },
  { stops: [{ color: '#ff9a9e', offset: 0 }, { color: '#fecfef', offset: 1 }], angle: 135 },
  { stops: [{ color: '#96fbc4', offset: 0 }, { color: '#f9f586', offset: 1 }], angle: 90 },
]

const activeTab = ref<'solid' | 'gradient'>(props.value.type === 'gradient' ? 'gradient' : 'solid')
const solidHex = ref(props.value.type === 'solid' ? (isTransparentCssColor(props.value.color) ? '#ffffff' : props.value.color) : '#ffffff')
const solidHexDraft = ref('')

const gradStart = ref(props.value.type === 'gradient' ? props.value.stops[0]?.color ?? '#000000' : '#667eea')
const gradEnd = ref(props.value.type === 'gradient' ? props.value.stops[1]?.color ?? '#ffffff' : '#764ba2')
const gradAngle = ref(props.value.type === 'gradient' ? props.value.angle : 135)

const solidHexDisplay = computed(() => solidHexDraft.value || solidHex.value)

watch(() => props.value, (v) => {
  activeTab.value = v.type === 'gradient' ? 'gradient' : 'solid'
  if (v.type === 'solid' && !isTransparentCssColor(v.color)) solidHex.value = v.color
  if (v.type === 'gradient') {
    gradStart.value = v.stops[0]?.color ?? '#000000'
    gradEnd.value = v.stops[1]?.color ?? '#ffffff'
    gradAngle.value = v.angle
  }
})

const HEX6 = /^#[0-9A-Fa-f]{6}$/

function parseHex(raw: string): string | null {
  const t = raw.trim()
  if (HEX6.test(t)) return t
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t}`
  return null
}

function clampAngle(n: number) {
  return Math.min(360, Math.max(0, Math.round(n)))
}

function gradientCss(stops: GradientStop[], angle: number) {
  return `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${Math.round(s.offset * 100)}%`).join(', ')})`
}

function swatchStyle(hex: string) {
  if (isTransparentCssColor(hex)) {
    return {
      background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 10px 10px',
    }
  }
  return { backgroundColor: hex }
}

function applySolid(hex: string) {
  solidHex.value = isTransparentCssColor(hex) ? '#ffffff' : hex
  solidHexDraft.value = ''
  emit('change', { type: 'solid', color: hex })
}

function onColorPickerInput(e: Event) {
  const hex = (e.target as HTMLInputElement).value
  solidHex.value = hex
  solidHexDraft.value = ''
  emit('change', { type: 'solid', color: hex })
}

function onHexInput(e: Event) {
  solidHexDraft.value = (e.target as HTMLInputElement).value
}

function onHexBlur() {
  const hex = parseHex(solidHexDraft.value)
  solidHexDraft.value = ''
  if (hex) applySolid(hex)
}

function applyGradient(stops: GradientStop[], angle: number) {
  gradStart.value = stops[0]?.color ?? '#000000'
  gradEnd.value = stops[1]?.color ?? '#ffffff'
  gradAngle.value = angle
  emitGradient()
}

function emitGradient() {
  const stops: GradientStop[] = [
    { color: gradStart.value, offset: 0 },
    { color: gradEnd.value, offset: 1 },
  ]
  const css = gradientCss(stops, gradAngle.value)
  emit('change', { type: 'gradient', css, stops, angle: gradAngle.value })
}

// suppress unused warning
bgValueToCss
</script>

<style scoped>
.avnac-bg-popover {
  width: 220px;
  padding: 12px;
  background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
</style>
