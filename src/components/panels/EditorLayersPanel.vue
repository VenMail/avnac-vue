<template>
  <div v-if="open" class="avnac-layers-panel">
    <div class="avnac-layers-header">
      <span class="text-sm font-semibold">Layers</span>
      <button class="avnac-icon-btn" title="Close" @click="emit('close')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div v-if="rows.length === 0" class="avnac-layers-empty">No layers</div>

    <div class="avnac-layers-list">
      <div
        v-for="row in rows"
        :key="row.id"
        class="avnac-layer-row"
        :class="{ selected: row.selected }"
        @click="emit('selectLayer', row.stackIndex)"
        @dblclick="startRename(row)"
      >
        <!-- Drag handle -->
        <span class="avnac-drag-handle" title="Drag to reorder"
          draggable="true"
          @dragstart="onDragStart($event, row.stackIndex)"
          @dragover.prevent
          @drop.prevent="onDrop($event, row.stackIndex)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
        </span>

        <!-- Label -->
        <input
          v-if="editingId === row.id"
          ref="renameInputRef"
          type="text"
          class="avnac-layer-rename-input"
          :value="renameDraft"
          @input="renameDraft = ($event.target as HTMLInputElement).value"
          @keydown.enter.prevent="commitRename(row.stackIndex)"
          @keydown.escape.prevent="editingId = null"
          @blur="commitRename(row.stackIndex)"
          @click.stop
        />
        <span v-else class="avnac-layer-label">{{ row.label }}</span>

        <!-- Controls -->
        <div class="avnac-layer-controls" @click.stop>
          <button class="avnac-icon-btn" :title="row.visible ? 'Hide' : 'Show'" @click="emit('toggleVisible', row.stackIndex)">
            <svg v-if="row.visible" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
          <button class="avnac-icon-btn" title="Bring forward" @click="emit('bringForward', row.stackIndex)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button class="avnac-icon-btn" title="Send backward" @click="emit('sendBackward', row.stackIndex)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

export interface EditorLayerRow {
  id: string
  stackIndex: number
  label: string
  visible: boolean
  selected: boolean
}

defineProps<{
  open: boolean
  rows: EditorLayerRow[]
}>()

const emit = defineEmits<{
  close: []
  selectLayer: [stackIndex: number]
  toggleVisible: [stackIndex: number]
  bringForward: [stackIndex: number]
  sendBackward: [stackIndex: number]
  reorder: [fromIndex: number, toIndex: number]
  renameLayer: [stackIndex: number, name: string]
}>()

const editingId = ref<string | null>(null)
const renameDraft = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

function startRename(row: EditorLayerRow) {
  editingId.value = row.id
  renameDraft.value = row.label
  nextTick(() => renameInputRef.value?.select())
}

function commitRename(stackIndex: number) {
  if (editingId.value !== null) {
    const name = renameDraft.value.trim()
    if (name) emit('renameLayer', stackIndex, name)
    editingId.value = null
  }
}

let dragFromIndex = -1

function onDragStart(_e: DragEvent, stackIndex: number) {
  dragFromIndex = stackIndex
}

function onDrop(_e: DragEvent, toIndex: number) {
  if (dragFromIndex !== -1 && dragFromIndex !== toIndex) {
    emit('reorder', dragFromIndex, toIndex)
  }
  dragFromIndex = -1
}
</script>

<style scoped>
.avnac-layers-panel {
  background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  width: 220px;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.avnac-layers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-default, #e0e0e0);
  flex-shrink: 0;
}
.avnac-layers-list {
  overflow-y: auto;
  flex: 1;
  padding: 4px;
}
.avnac-layers-empty {
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--fg-subtle, #737373);
}
.avnac-layer-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.avnac-layer-row:hover { background: var(--bg-subtle, #f5f5f5); }
.avnac-layer-row.selected { background: var(--accent-subtle, #eff6ff); color: var(--accent, #2563eb); }
.avnac-drag-handle {
  cursor: grab;
  color: var(--fg-subtle, #aaa);
  flex-shrink: 0;
}
.avnac-layer-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.avnac-layer-rename-input {
  flex: 1;
  border: 1px solid var(--border-default, #d4d4d4);
  border-radius: 4px;
  padding: 1px 4px;
  font-size: 12px;
  outline: none;
}
.avnac-layer-controls {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
}
.avnac-layer-row:hover .avnac-layer-controls,
.avnac-layer-row.selected .avnac-layer-controls {
  opacity: 1;
}
.avnac-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--fg-default, #262626);
}
.avnac-icon-btn:hover { background: var(--bg-subtle, #e8e8e8); }
</style>
