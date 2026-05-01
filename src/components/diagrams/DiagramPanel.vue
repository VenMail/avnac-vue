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
          <select
            class="node-type-select"
            :value="node.type"
            @change="updateNodeType(node.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="process">Process</option>
            <option value="decision">Decision</option>
            <option value="terminal">Terminal</option>
            <option value="io">I/O</option>
            <option value="org-node">Org</option>
          </select>
          <input
            class="node-label-input"
            :value="node.label"
            @change="updateNodeLabel(node.id, ($event.target as HTMLInputElement).value)"
          />
          <button class="icon-btn danger" title="Remove node" @click="removeNode(node.id)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="action-row">
        <button class="layout-btn" @click="addNode">
          Add node
        </button>
        <button v-if="store.editingData?.type === 'organogram'" class="layout-btn" @click="autoLayout">
          Auto-layout
        </button>
      </div>

      <div class="section-label">Connectors</div>
      <div class="edges-list">
        <div
          v-for="edge in store.editingData?.edges ?? []"
          :key="edge.id"
          class="edge-row"
        >
          <select class="edge-select" :value="edge.fromId" @change="updateEdge(edge.id, { fromId: ($event.target as HTMLSelectElement).value })">
            <option v-for="node in store.editingData?.nodes ?? []" :key="node.id" :value="node.id">
              {{ shortLabel(node.label) }}
            </option>
          </select>
          <span class="edge-arrow">-&gt;</span>
          <select class="edge-select" :value="edge.toId" @change="updateEdge(edge.id, { toId: ($event.target as HTMLSelectElement).value })">
            <option v-for="node in store.editingData?.nodes ?? []" :key="node.id" :value="node.id">
              {{ shortLabel(node.label) }}
            </option>
          </select>
          <button class="icon-btn danger" title="Remove connector" @click="removeEdge(edge.id)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
          <div class="edge-options">
            <select class="edge-port-select" :value="edge.fromPort" title="From port" @change="updateEdge(edge.id, { fromPort: ($event.target as HTMLSelectElement).value as DiagramPort })">
              <option value="top">Top</option>
              <option value="right">Right</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
            </select>
            <select class="edge-port-select" :value="edge.toPort" title="To port" @change="updateEdge(edge.id, { toPort: ($event.target as HTMLSelectElement).value as DiagramPort })">
              <option value="top">Top</option>
              <option value="right">Right</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
            </select>
            <select class="edge-port-select" :value="edge.style" title="Line style" @change="updateEdge(edge.id, { style: ($event.target as HTMLSelectElement).value as DiagramLineStyle })">
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
            </select>
            <select class="edge-port-select" :value="edge.routing ?? 'straight'" title="Routing" @change="updateEdge(edge.id, { routing: ($event.target as HTMLSelectElement).value as DiagramRouting })">
              <option value="straight">Straight</option>
              <option value="orthogonal">Elbow</option>
            </select>
            <label class="edge-toggle">
              <input type="checkbox" :checked="edge.arrowEnd" @change="updateEdge(edge.id, { arrowEnd: ($event.target as HTMLInputElement).checked })" />
              Arrow
            </label>
          </div>
        </div>
      </div>

      <div class="connector-builder">
        <select class="edge-select" v-model="newEdgeFromId">
          <option disabled value="">From</option>
          <option v-for="node in store.editingData?.nodes ?? []" :key="node.id" :value="node.id">
            {{ shortLabel(node.label) }}
          </option>
        </select>
        <select class="edge-select" v-model="newEdgeToId">
          <option disabled value="">To</option>
          <option v-for="node in store.editingData?.nodes ?? []" :key="node.id" :value="node.id">
            {{ shortLabel(node.label) }}
          </option>
        </select>
        <button class="layout-btn" :disabled="!canAddEdge" @click="addEdge">Add connector</button>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDiagramsStore } from '#/stores/diagrams'
import { defaultFlowchart, defaultOrganogram } from '#/lib/avnac-diagram'
import { treeLayout } from '#/lib/avnac-diagram-layout'
import type { AvnacDiagramData, DiagramEdge, DiagramNode, DiagramNodeType } from '#/lib/avnac-diagram'

type DiagramPort = DiagramEdge['fromPort']
type DiagramLineStyle = DiagramEdge['style']
type DiagramRouting = NonNullable<DiagramEdge['routing']>

const store = useDiagramsStore()
const emit = defineEmits<{ insert: [data: AvnacDiagramData] }>()
const newEdgeFromId = ref('')
const newEdgeToId = ref('')

const canAddEdge = computed(() => (
  !!store.editingData &&
  !!newEdgeFromId.value &&
  !!newEdgeToId.value &&
  newEdgeFromId.value !== newEdgeToId.value
))

watch(() => store.editingData?.nodes.map((node) => node.id).join('|'), () => {
  const ids = new Set(store.editingData?.nodes.map((node) => node.id) ?? [])
  if (!ids.has(newEdgeFromId.value)) newEdgeFromId.value = ''
  if (!ids.has(newEdgeToId.value)) newEdgeToId.value = ''
})

function onInsert(type: 'flowchart' | 'organogram') {
  const data = type === 'flowchart' ? defaultFlowchart() : defaultOrganogram()
  emit('insert', data)
}

function uid(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function patch(data: AvnacDiagramData) {
  store.updateData(data)
}

function shortLabel(label: string): string {
  return label.length > 18 ? `${label.slice(0, 16)}...` : label
}

function updateNodeLabel(id: string, label: string) {
  if (!store.editingData) return
  patch({
    ...store.editingData,
    nodes: store.editingData.nodes.map(n => n.id === id ? { ...n, label } : n),
  })
}

function updateNodeType(id: string, type: string) {
  if (!store.editingData) return
  patch({
    ...store.editingData,
    nodes: store.editingData.nodes.map(n => n.id === id ? { ...n, type: type as DiagramNodeType } : n),
  })
}

function addNode() {
  if (!store.editingData) return
  const nodes = store.editingData.nodes
  const last = nodes[nodes.length - 1]
  const node: DiagramNode = {
    id: uid('node'),
    type: store.editingData.type === 'organogram' ? 'org-node' : 'process',
    label: store.editingData.type === 'organogram' ? 'New Role' : 'New Step',
    x: last ? last.x : 200,
    y: last ? last.y + 100 : 120,
    w: 160,
    h: 50,
    fill: {
      type: 'solid',
      color: store.editingData.type === 'organogram' ? '#70ad47' : '#4472c4',
    },
  }
  patch({ ...store.editingData, nodes: [...nodes, node] })
}

function removeNode(id: string) {
  if (!store.editingData || store.editingData.nodes.length <= 1) return
  patch({
    ...store.editingData,
    nodes: store.editingData.nodes.filter(node => node.id !== id),
    edges: store.editingData.edges.filter(edge => edge.fromId !== id && edge.toId !== id),
  })
}

function updateEdge(id: string, partial: Partial<DiagramEdge>) {
  if (!store.editingData) return
  patch({
    ...store.editingData,
    edges: store.editingData.edges.map(edge => {
      if (edge.id !== id) return edge
      const next = { ...edge, ...partial }
      return next.fromId === next.toId ? edge : next
    }),
  })
}

function addEdge() {
  if (!store.editingData || !canAddEdge.value) return
  const from = store.editingData.nodes.find(node => node.id === newEdgeFromId.value)
  const to = store.editingData.nodes.find(node => node.id === newEdgeToId.value)
  const ports = suggestedPorts(from, to)
  const edge: DiagramEdge = {
    id: uid('edge'),
    fromId: newEdgeFromId.value,
    fromPort: ports.fromPort,
    toId: newEdgeToId.value,
    toPort: ports.toPort,
    style: 'solid',
    arrowEnd: store.editingData.type === 'flowchart',
    routing: store.editingData.type === 'organogram' ? 'orthogonal' : 'straight',
  }
  patch({ ...store.editingData, edges: [...store.editingData.edges, edge] })
}

function removeEdge(id: string) {
  if (!store.editingData) return
  patch({
    ...store.editingData,
    edges: store.editingData.edges.filter(edge => edge.id !== id),
  })
}

function autoLayout() {
  if (!store.editingData) return
  const laid = treeLayout(store.editingData.nodes, store.editingData.edges)
  patch({ ...store.editingData, nodes: laid })
}

function suggestedPorts(from: DiagramNode | undefined, to: DiagramNode | undefined): {
  fromPort: DiagramPort
  toPort: DiagramPort
} {
  if (!from || !to) return { fromPort: 'bottom', toPort: 'top' }
  const fromCx = from.x + from.w / 2
  const fromCy = from.y + from.h / 2
  const toCx = to.x + to.w / 2
  const toCy = to.y + to.h / 2
  const dx = toCx - fromCx
  const dy = toCy - fromCy

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0
      ? { fromPort: 'right', toPort: 'left' }
      : { fromPort: 'left', toPort: 'right' }
  }

  return dy >= 0
    ? { fromPort: 'bottom', toPort: 'top' }
    : { fromPort: 'top', toPort: 'bottom' }
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
.nodes-list,
.edges-list { display: flex; flex-direction: column; gap: 3px; }
.node-row { display: flex; align-items: center; gap: 4px; }
.edge-row,
.connector-builder,
.action-row { display: flex; align-items: center; gap: 4px; }
.edge-row { flex-wrap: wrap; }
.connector-builder { align-items: stretch; }
.node-type-select,
.edge-select,
.edge-port-select {
  min-width: 0;
  padding: 3px 5px;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 4px;
  font-size: 11px;
  background: var(--surface-raised, #fff);
  color: var(--fg-default, #262626);
}
.node-type-select { width: 74px; flex-shrink: 0; }
.edge-select { flex: 1; }
.edge-port-select { flex: 1; min-width: 62px; }
.edge-arrow { color: var(--fg-muted, #737373); font-size: 12px; }
.edge-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  gap: 4px;
  width: 100%;
  padding-left: 2px;
}
.edge-toggle {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--fg-muted, #666);
  white-space: nowrap;
}
.node-label-input {
  flex: 1; padding: 3px 6px; border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 4px; font-size: 11px;
}
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: var(--fg-muted, #737373);
  cursor: pointer;
}
.icon-btn:hover { background: var(--bg-subtle, #f5f5f5); color: var(--fg-default, #262626); }
.icon-btn.danger:hover { background: #fee2e2; color: #dc2626; }
.layout-btn {
  padding: 5px 12px; border: 1px solid var(--border-default, #ccc);
  border-radius: 6px; background: var(--surface-raised, #fff); cursor: pointer; font-size: 11px;
}
.layout-btn:hover { background: var(--bg-subtle, #f5f5f5); }
.layout-btn:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
