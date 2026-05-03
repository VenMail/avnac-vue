<template>
  <Teleport to="body">
    <Transition name="cdd-fade">
      <div v-if="store.editingChartId !== null" class="cdd-backdrop" @click.self="onCancel">
        <div class="cdd-card" role="dialog" aria-modal="true" aria-label="Edit chart data">
          <div class="cdd-header">
            <span class="cdd-title">Edit chart data</span>
            <button class="cdd-close" title="Close" @click="onCancel">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="cdd-body">
            <ChartDataEditor
              v-if="draftData"
              :value="draftData"
              @update:value="draftData = $event"
            />
          </div>

          <div class="cdd-footer">
            <button class="cdd-btn cdd-cancel" @click="onCancel">Cancel</button>
            <button class="cdd-btn cdd-save" @click="onSave">Save</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChartsStore } from '#/stores/charts'
import ChartDataEditor from './ChartDataEditor.vue'
import { cloneAvnacPlain } from '#/lib/avnac-document'
import type { AvnacChartData } from '#/lib/avnac-chart-data'

const store = useChartsStore()
const draftData = ref<AvnacChartData | null>(null)

// Copy editingChartData into draft when dialog opens
watch(
  () => store.editingChartData,
  (data) => {
    if (data) draftData.value = cloneAvnacPlain(data)
  },
  { immediate: true },
)

function onCancel() {
  store.closeChartEditor()
}

function onSave() {
  if (draftData.value) {
    store.updateChartData(draftData.value)
  }
  store.closeChartEditor()
}
</script>

<style scoped>
.cdd-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}
.cdd-card {
  width: min(720px, 96vw);
  max-height: 88vh;
  background: var(--surface-raised, #fff);
  border-radius: 14px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cdd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--border-default, #e0e0e0);
  flex-shrink: 0;
}
.cdd-title { font-weight: 600; font-size: 15px; color: var(--fg-default, #262626); }
.cdd-close {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px; border: none;
  background: transparent; cursor: pointer; color: var(--fg-muted, #71717a);
}
.cdd-close:hover { background: var(--bg-subtle, #f5f5f5); }
.cdd-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
  min-height: 320px;
}
.cdd-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--border-default, #e0e0e0);
  flex-shrink: 0;
}
.cdd-btn {
  padding: 6px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}
.cdd-cancel {
  background: var(--bg-subtle, #f5f5f5);
  color: var(--fg-default, #262626);
}
.cdd-cancel:hover { background: var(--bg-canvas, #ebebeb); }
.cdd-save {
  background: var(--accent, #6366f1);
  color: #fff;
}
.cdd-save:hover { opacity: 0.9; }

.cdd-fade-enter-active, .cdd-fade-leave-active { transition: opacity 0.15s; }
.cdd-fade-enter-from, .cdd-fade-leave-to { opacity: 0; }
</style>
