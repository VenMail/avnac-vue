<template>
  <div ref="rootRef" class="relative">
    <button
      class="avnac-toolbar-btn"
      :disabled="isDisabled"
      title="Corner radius"
      @click="toggle"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12V7a4 4 0 0 1 4-4h5"/>
      </svg>
      <span class="text-xs ml-1">{{ displayValue }}</span>
    </button>
    <div
      v-if="open && !isDisabled"
      ref="panelRef"
      class="absolute z-50 avnac-popover"
      :class="openUpward ? 'bottom-full mb-2' : 'top-full mt-2'"
      :style="{ transform: `translateX(calc(-50% + ${shiftX}px))`, left: '50%' }"
    >
      <div class="flex items-center gap-2">
        <label class="text-xs text-[var(--fg-subtle,#737373)]">Radius</label>
        <EditorRangeSlider :value="value" :min="0" :max="sliderMax" @change="emit('change', Math.min($event, safeMax))" />
        <span class="text-xs font-mono w-8 text-right">{{ displayValue }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useViewportPopover, useClickOutside } from '#/composables/useViewportPopover'
import EditorRangeSlider from '#/components/shared/EditorRangeSlider.vue'

const props = withDefaults(defineProps<{
  value: number
  max: number
  disabled?: boolean
}>(), { disabled: false })

const emit = defineEmits<{ change: [v: number] }>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const safeMax = computed(() => Math.max(0, props.max))
const sliderMax = computed(() => Math.max(1, Math.ceil(safeMax.value)))
const isDisabled = computed(() => props.disabled || safeMax.value <= 0)
const displayValue = computed(() => Math.round(Math.min(props.value, safeMax.value)))

const { openUpward, shiftX, update } = useViewportPopover(80)
const { attach, detach } = useClickOutside(() => [rootRef.value, panelRef.value], () => { open.value = false })

function toggle() {
  if (isDisabled.value) return
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
.avnac-toolbar-btn:hover:not(:disabled) { background: var(--bg-subtle, #f0f0f0); }
.avnac-toolbar-btn:disabled { opacity: 0.4; cursor: default; }
.avnac-popover {
  background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 10px 14px;
  min-width: 200px;
}
</style>
