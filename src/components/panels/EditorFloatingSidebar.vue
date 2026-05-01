<template>
  <nav
    class="avnac-sidebar-nav"
    :class="{ disabled }"
    aria-label="Editor panels"
  >
    <button
      v-for="item in ITEMS"
      :key="item.id"
      class="avnac-sidebar-btn"
      :class="[{ active: activePanel === item.id }, item.id === 'ai' ? 'avnac-ai-btn' : '']"
      :title="item.label"
      @click="emit('selectPanel', item.id as any)"
    >
      <span v-html="item.icon" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { EditorSidebarPanelId } from '#/lib/editor-sidebar-panel-layout'

defineProps<{
  activePanel: EditorSidebarPanelId | null
  disabled?: boolean
}>()

const emit = defineEmits<{ selectPanel: [id: EditorSidebarPanelId] }>()

const ITEMS = [
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
    id: 'vector-board',
    label: 'Pen',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
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
    id: 'animations',
    label: 'Animate',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.2L12 14l-4.8 2.5.9-5.2L4.3 7.6l5.3-.8z"/></svg>',
  },
  {
    id: 'ai',
    label: 'AI',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>',
  },
  {
    id: 'apps',
    label: 'Apps',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/></svg>',
  },
]
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
.avnac-sidebar-btn:hover { background: var(--bg-subtle, #f5f5f5); color: var(--fg-default, #262626); }
.avnac-sidebar-btn.active { background: #fff; color: var(--fg-default, #262626); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.avnac-ai-btn.active { background: var(--accent, #6366f1); color: #fff; }
</style>
