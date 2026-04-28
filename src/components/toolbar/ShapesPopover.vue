<template>
  <div ref="rootRef" class="relative">
    <button
      class="avnac-toolbar-btn"
      :aria-expanded="open"
      aria-label="Add shape"
      @click="toggle"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    </button>
    <div
      v-if="open"
      ref="panelRef"
      class="absolute z-50 avnac-shapes-menu"
      :class="openUpward ? 'bottom-full mb-2' : 'top-full mt-2'"
      :style="{ transform: `translateX(calc(-50% + ${shiftX}px))`, left: '50%' }"
      role="menu"
    >
      <button
        v-for="shape in SHAPES"
        :key="shape.kind"
        class="avnac-shape-item"
        role="menuitem"
        @click="pick(shape.kind)"
      >
        <span class="avnac-shape-icon" v-html="shape.icon" />
        <span>{{ shape.label }}</span>
        <span v-if="shape.kind === 'rect'" class="avnac-shape-badge">default</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useViewportPopover, useClickOutside } from '#/composables/useViewportPopover'

const emit = defineEmits<{ pick: [kind: string] }>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const { openUpward, shiftX, update } = useViewportPopover(280)
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

function pick(kind: string) {
  open.value = false
  detach()
  emit('pick', kind)
}

const SHAPES = [
  {
    kind: 'rect',
    label: 'Rectangle',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
  },
  {
    kind: 'ellipse',
    label: 'Ellipse',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="7"/></svg>',
  },
  {
    kind: 'polygon',
    label: 'Polygon',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 22,20 2,20"/></svg>',
  },
  {
    kind: 'star',
    label: 'Star',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>',
  },
  {
    kind: 'line',
    label: 'Line',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  },
  {
    kind: 'arrow',
    label: 'Arrow',
    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="14,7 19,12 14,17"/></svg>',
  },
]
</script>

<style scoped>
.avnac-toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--fg-default, #262626);
}
.avnac-toolbar-btn:hover {
  background: var(--bg-subtle, #f5f5f5);
}
.avnac-shapes-menu {
  background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 6px;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.avnac-shape-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  color: var(--fg-default, #262626);
  width: 100%;
}
.avnac-shape-item:hover {
  background: var(--bg-subtle, #f5f5f5);
}
.avnac-shape-badge {
  margin-left: auto;
  font-size: 10px;
  color: var(--fg-subtle, #737373);
  background: var(--bg-subtle, #f0f0f0);
  border-radius: 4px;
  padding: 1px 5px;
}
</style>
