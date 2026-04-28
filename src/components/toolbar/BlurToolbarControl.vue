<template>
  <div ref="rootRef" class="relative">
    <button class="avnac-toolbar-btn" title="Blur" @click="toggle">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" stroke-dasharray="3 2"/>
      </svg>
      <span class="text-xs ml-1">{{ Math.round(blurPct) }}%</span>
    </button>
    <div
      v-if="open"
      ref="panelRef"
      class="absolute z-50 avnac-popover"
      :class="openUpward ? 'bottom-full mb-2' : 'top-full mt-2'"
      :style="{ transform: `translateX(calc(-50% + ${shiftX}px))`, left: '50%' }"
    >
      <div class="flex items-center gap-2">
        <label class="text-xs text-[var(--fg-subtle,#737373)]">Blur</label>
        <EditorRangeSlider :value="blurPct" :min="0" :max="100" @change="emit('change', $event)" />
        <span class="text-xs font-mono w-8 text-right">{{ Math.round(blurPct) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useViewportPopover, useClickOutside } from '#/composables/useViewportPopover'
import EditorRangeSlider from '#/components/shared/EditorRangeSlider.vue'

defineProps<{ blurPct: number }>()
const emit = defineEmits<{ change: [v: number] }>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const { openUpward, shiftX, update } = useViewportPopover(80)
const { attach, detach } = useClickOutside(() => [rootRef.value, panelRef.value], () => { open.value = false })

function toggle() {
  open.value = !open.value
  if (open.value) {
    attach()
    requestAnimationFrame(() => update(rootRef.value, panelRef.value))
  } else {
    detach()
  }
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
  padding: 10px 14px;
  min-width: 200px;
}
</style>
