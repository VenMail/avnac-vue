<template>
  <nav
    class="avnac-sidebar-nav"
    :class="{ disabled }"
    aria-label="Editor panels"
  >
    <div class="avnac-sidebar-group">
      <ShapesPopover @pick="emit('insertShape', $event)" />
      <button class="avnac-sidebar-btn avnac-sidebar-btn--text" title="Text box" @click="emit('insertText')">T</button>
      <div ref="lineRootRef" class="avnac-line-tool">
        <button
          class="avnac-sidebar-btn"
          title="Line tool"
          :aria-expanded="lineOpen"
          @click="toggleLineMenu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <line x1="5" y1="19" x2="19" y2="5"/>
          </svg>
        </button>
        <div v-if="lineOpen" ref="linePanelRef" class="avnac-line-menu">
          <button @click="pickLine('line')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Straight line
          </button>
          <button @click="pickLine('curved-line')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 18 Q12 4 20 18"/></svg>
            Curved line
          </button>
          <button @click="pickLine('connector')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 7h7v10h7"/><polyline points="15 13 19 17 15 21"/></svg>
            Connector
          </button>
        </div>
      </div>
      <button class="avnac-sidebar-btn" title="Pen" @click="emit('startPen')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      </button>
    </div>

    <div class="avnac-sidebar-separator" />

    <div class="avnac-sidebar-group avnac-sidebar-group--panels">
      <button
        v-for="item in PRIMARY_ITEMS"
        :key="item.id"
        class="avnac-sidebar-btn"
        :class="[{ active: activePanel === item.id }, item.id === 'ai' ? 'avnac-ai-btn' : '']"
        :title="item.label"
        @click="emit('selectPanel', item.id as any)"
      >
        <span v-html="item.icon" />
      </button>
    </div>

    <div class="avnac-sidebar-bottom">
      <button
        v-for="item in BOTTOM_ITEMS"
        :key="item.id"
        class="avnac-sidebar-btn"
        :class="{ active: activePanel === item.id }"
        :title="item.label"
        @click="emit('selectPanel', item.id as any)"
      >
        <span v-html="item.icon" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { EditorSidebarPanelId } from '#/lib/editor-sidebar-panel-layout'
import ShapesPopover from '#/components/toolbar/ShapesPopover.vue'
import { useClickOutside } from '#/composables/useViewportPopover'

defineProps<{
  activePanel: EditorSidebarPanelId | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  selectPanel: [id: EditorSidebarPanelId]
  insertText: []
  insertShape: [kind: string]
  insertLine: [kind: 'line' | 'curved-line' | 'connector']
  startPen: []
}>()

const PRIMARY_ITEMS = [
  {
    id: 'layers',
    label: 'Layers',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  },
  {
    id: 'images',
    label: 'Images',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  },
  {
    id: 'uploads',
    label: 'Uploads',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>',
  },
  {
    id: 'charts',
    label: 'Charts',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>',
  },
  {
    id: 'infographics',
    label: 'Infographics',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 22 20 2 20"/><polygon points="12 8 18 20 6 20"/></svg>',
  },
  {
    id: 'diagrams',
    label: 'Diagrams',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="2" width="8" height="5" rx="1"/><rect x="2" y="16" width="8" height="5" rx="1"/><rect x="14" y="16" width="8" height="5" rx="1"/><line x1="12" y1="7" x2="6" y2="16"/><line x1="12" y1="7" x2="18" y2="16"/></svg>',
  },
  {
    id: 'ai',
    label: 'AI',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>',
  },
]

const BOTTOM_ITEMS = [
  {
    id: 'animations',
    label: 'Animate',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.2L12 14l-4.8 2.5.9-5.2L4.3 7.6l5.3-.8z"/></svg>',
  },
  {
    id: 'apps',
    label: 'Apps',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/></svg>',
  },
]

const lineOpen = ref(false)
const lineRootRef = ref<HTMLElement | null>(null)
const linePanelRef = ref<HTMLElement | null>(null)

const { attach: attachLine, detach: detachLine } = useClickOutside(
  () => [lineRootRef.value, linePanelRef.value],
  () => { lineOpen.value = false; detachLine() },
)

function toggleLineMenu() {
  lineOpen.value = !lineOpen.value
  if (lineOpen.value) attachLine()
  else detachLine()
}

function pickLine(kind: 'line' | 'curved-line' | 'connector') {
  lineOpen.value = false
  detachLine()
  emit('insertLine', kind)
}
</script>

<style scoped>
.avnac-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  max-height: calc(100vh - 96px);
}
.avnac-sidebar-nav.disabled {
  opacity: 0.4;
  pointer-events: none;
}
.avnac-sidebar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--fg-subtle, #737373);
}
:deep(.avnac-toolbar-btn) {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--fg-subtle, #737373);
}
:deep(.avnac-toolbar-btn:hover) {
  background: var(--bg-subtle, #f5f5f5);
  color: var(--fg-default, #262626);
}
.avnac-sidebar-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.avnac-sidebar-group--panels {
  min-height: 0;
  overflow-y: auto;
}
.avnac-sidebar-separator {
  height: 1px;
  margin: 4px 2px;
  background: var(--border-default, #e0e0e0);
  flex-shrink: 0;
}
.avnac-sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
  padding-top: 4px;
  border-top: 1px solid var(--border-default, #e0e0e0);
  flex-shrink: 0;
}
.avnac-sidebar-btn--text {
  font-size: 18px;
  font-weight: 700;
}
.avnac-line-tool {
  position: relative;
}
.avnac-line-menu {
  position: absolute;
  right: calc(100% + 8px);
  top: 0;
  z-index: 50;
  min-width: 150px;
  padding: 6px;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 10px;
  background: var(--surface-raised, #fff);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
.avnac-line-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--fg-default, #262626);
  cursor: pointer;
  font-size: 12px;
  text-align: left;
}
.avnac-line-menu button:hover {
  background: var(--bg-subtle, #f5f5f5);
}
.avnac-sidebar-btn:hover { background: var(--bg-subtle, #f5f5f5); color: var(--fg-default, #262626); }
.avnac-sidebar-btn.active { background: #fff; color: var(--fg-default, #262626); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.avnac-ai-btn.active { background: var(--accent, #6366f1); color: #fff; }
</style>
