<template>
  <div ref="rootRef" class="relative">
    <button
      :title="title"
      :aria-label="ariaLabel ?? title"
      class="avnac-paint-btn"
      :class="compact ? 'w-7 h-7 rounded' : 'w-8 h-8 rounded-md'"
      @click="toggleOpen"
    >
      <div class="w-full h-full rounded" :style="swatchStyle" />
    </button>
    <div
      v-if="open"
      ref="panelRef"
      class="absolute z-50"
      :class="openUpward ? 'bottom-full mb-2' : 'top-full mt-2'"
      style="left: 50%; margin-left: -110px;"
    >
      <BackgroundPopover :value="value" @change="onBgChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BgValue } from '#/lib/bg-value'
import { bgValueToSwatch } from '#/lib/bg-value'
import { useViewportPopover, useClickOutside } from '#/composables/useViewportPopover'
import BackgroundPopover from './BackgroundPopover.vue'

const props = withDefaults(defineProps<{
  value: BgValue
  title?: string
  ariaLabel?: string
  compact?: boolean
}>(), { title: 'Color', compact: false })

const emit = defineEmits<{ change: [v: BgValue] }>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const { openUpward, update } = useViewportPopover(440)
const { attach, detach } = useClickOutside(() => [rootRef.value, panelRef.value], () => { open.value = false })

const swatchStyle = computed(() => bgValueToSwatch(props.value))

function toggleOpen() {
  open.value = !open.value
  if (open.value) {
    attach()
    requestAnimationFrame(() => update(rootRef.value, panelRef.value))
  } else {
    detach()
  }
}

function onBgChange(v: BgValue) {
  emit('change', v)
}
</script>

<style scoped>
.avnac-paint-btn {
  border: 1px solid var(--border-default, #e0e0e0);
  padding: 2px;
  cursor: pointer;
  background: var(--surface-raised, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avnac-paint-btn:hover {
  border-color: var(--border-strong, #a0a0a0);
}
</style>
