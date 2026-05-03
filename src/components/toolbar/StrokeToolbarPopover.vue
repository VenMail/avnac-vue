<template>
  <div ref="rootRef" class="relative">
    <button class="avnac-toolbar-btn" title="Stroke" @click="toggle">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
      <span class="text-xs ml-1">{{ displayWidth }}</span>
    </button>
    <div
      v-if="open"
      ref="panelRef"
      class="absolute z-50 avnac-popover"
      :class="openUpward ? 'bottom-full mb-2' : 'top-full mt-2'"
      style="left: 50%; margin-left: -110px;"
    >
      <div class="flex items-center gap-2 mb-3">
        <label class="text-xs text-[var(--fg-subtle,#737373)] w-20">Width</label>
        <EditorRangeSlider :value="strokeWidthPx" :min="strokeWidthMin" :max="strokeWidthMax" @change="emit('strokeWidthChange', $event)" />
        <span class="text-xs font-mono w-6 text-right">{{ displayWidth }}</span>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-[var(--fg-subtle,#737373)] w-20">Color</label>
        <PaintPopoverControl :value="strokePaint" compact @change="emit('strokePaintChange', $event)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BgValue } from '#/lib/bg-value'
import { useViewportPopover, useClickOutside } from '#/composables/useViewportPopover'
import EditorRangeSlider from '#/components/shared/EditorRangeSlider.vue'
import PaintPopoverControl from '#/components/shared/PaintPopoverControl.vue'

const props = withDefaults(defineProps<{
  strokeWidthPx: number
  strokePaint: BgValue
  strokeWidthMin?: number
  strokeWidthMax?: number
}>(), { strokeWidthMin: 0, strokeWidthMax: 40 })

const emit = defineEmits<{
  strokeWidthChange: [v: number]
  strokePaintChange: [v: BgValue]
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const { openUpward, update } = useViewportPopover(120)
const { attach, detach } = useClickOutside(() => [rootRef.value, panelRef.value], () => { open.value = false })

const displayWidth = computed(() => Math.max(props.strokeWidthMin, Math.min(props.strokeWidthMax, Math.round(props.strokeWidthPx))))

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
  padding: 12px 14px;
  min-width: 220px;
}
</style>
