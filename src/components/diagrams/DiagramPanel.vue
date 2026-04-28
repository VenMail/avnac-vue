<template>
  <div class="diagram-panel">
    <template v-if="!store.editingId">
      <div class="section-label">Create diagram</div>
      <div class="type-row">
        <button class="type-btn" @click="onInsert('flowchart')">
          <svg viewBox="0 0 60 50" width="60" height="50" fill="none">
            <rect x="16" y="2" width="28" height="14" rx="7" fill="#4472c4"/>
            <rect x="16" y="22" width="28" height="14" rx="2" fill="#ed7d31"/>
            <rect x="16" y="42" width="28" height="14" rx="7" fill="#4472c4"/>
            <line x1="30" y1="16" x2="30" y2="22" stroke="#888" stroke-width="1.5"/>
            <line x1="30" y1="36" x2="30" y2="42" stroke="#888" stroke-width="1.5"/>
          </svg>
          <span>Flowchart</span>
        </button>
        <button class="type-btn" @click="onInsert('organogram')">
          <svg viewBox="0 0 60 50" width="60" height="50" fill="none">
            <rect x="20" y="2" width="20" height="12" rx="2" fill="#4472c4"/>
            <rect x="4" y="22" width="20" height="12" rx="2" fill="#70ad47"/>
            <rect x="36" y="22" width="20" height="12" rx="2" fill="#70ad47"/>
            <rect x="4" y="42" width="20" height="12" rx="2" fill="#a9d18e"/>
            <line x1="30" y1="14" x2="14" y2="22" stroke="#888" stroke-width="1.5"/>
            <line x1="30" y1="14" x2="46" y2="22" stroke="#888" stroke-width="1.5"/>
            <line x1="14" y1="34" x2="14" y2="42" stroke="#888" stroke-width="1.5"/>
          </svg>
          <span>Organogram</span>
        </button>
      </div>
    </template>

    <template v-else>
      <div class="editor-header">
        <span class="diagram-type">{{ store.editingData?.type }}</span>
        <button class="back-btn" @click="store.closeEditor()">← Back</button>
      </div>

      <div class="section-label">Nodes</div>
      <div class="nodes-list">
        <div
          v-for="node in store.editingData?.nodes ?? []"
          :key="node.id"
          class="node-row"
        >
          <span class="node-type-badge" :class="node.type">{{ nodeTypeLabel(node.type) }}</span>
          <input
            class="node-label-input"
            :value="node.label"
            @change="updateNodeLabel(node.id, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <button v-if="store.editingData?.type === 'organogram'" class="layout-btn" @click="autoLayout">
        Auto-layout
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useDiagramsStore } from '#/stores/diagrams'
import { defaultFlowchart, defaultOrganogram } from '#/lib/avnac-diagram'
import { treeLayout } from '#/lib/avnac-diagram-layout'
import type { AvnacDiagramData } from '#/lib/avnac-diagram'

const store = useDiagramsStore()
const emit = defineEmits<{ insert: [data: AvnacDiagramData] }>()

function onInsert(type: 'flowchart' | 'organogram') {
  const data = type === 'flowchart' ? defaultFlowchart() : defaultOrganogram()
  emit('insert', data)
}

function nodeTypeLabel(type: string): string {
  return { process: 'Proc', decision: 'Dec', terminal: 'Term', io: 'I/O', 'org-node': 'Org' }[type] ?? type
}

function updateNodeLabel(id: string, label: string) {
  if (!store.editingData) return
  store.updateData({
    ...store.editingData,
    nodes: store.editingData.nodes.map(n => n.id === id ? { ...n, label } : n),
  })
}

function autoLayout() {
  if (!store.editingData) return
  const laid = treeLayout(store.editingData.nodes, store.editingData.edges)
  store.updateData({ ...store.editingData, nodes: laid })
}
</script>

<style scoped>
.diagram-panel { padding: 8px; display: flex; flex-direction: column; gap: 8px; }
.section-label { font-size: 11px; font-weight: 600; color: var(--fg-muted, #666); text-transform: uppercase; letter-spacing: 0.05em; }
.type-row { display: flex; gap: 8px; }
.type-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 4px; border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 8px; background: var(--surface-raised, #fff); cursor: pointer; font-size: 11px;
}
.type-btn:hover { background: var(--bg-subtle, #f5f5f5); }
.editor-header { display: flex; align-items: center; justify-content: space-between; }
.diagram-type { font-size: 12px; font-weight: 600; text-transform: capitalize; }
.back-btn { font-size: 11px; color: var(--accent, #0070f3); border: none; background: transparent; cursor: pointer; }
.nodes-list { display: flex; flex-direction: column; gap: 3px; }
.node-row { display: flex; align-items: center; gap: 4px; }
.node-type-badge {
  font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px;
  color: #fff; background: #888; flex-shrink: 0;
}
.node-type-badge.process { background: #4472c4; }
.node-type-badge.decision { background: #ed7d31; }
.node-type-badge.terminal { background: #4472c4; }
.node-type-badge.org-node { background: #70ad47; }
.node-label-input {
  flex: 1; padding: 3px 6px; border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 4px; font-size: 11px;
}
.layout-btn {
  padding: 5px 12px; border: 1px solid var(--border-default, #ccc);
  border-radius: 6px; background: var(--surface-raised, #fff); cursor: pointer; font-size: 11px;
}
.layout-btn:hover { background: var(--bg-subtle, #f5f5f5); }
</style>
