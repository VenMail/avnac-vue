<template>
  <div class="chart-data-panel">
    <template v-if="store.editingChartData">
      <ChartDataEditor
        :value="store.editingChartData"
        @update:value="store.updateChartData($event)"
      />
      <div class="panel-actions">
        <button class="apply-btn" @click="store.closeChartEditor()">Done</button>
      </div>
    </template>
    <template v-else>
      <div class="chart-insert-header">
        <strong>Insert chart</strong>
        <span>Choose a starter chart, then edit its data from the toolbar.</span>
      </div>
      <ChartTypeSelector :model-value="selectedType" @update:model-value="selectedType = $event" />
      <button class="apply-btn" @click="emit('insert', defaultChartData(selectedType))">Insert chart</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChartsStore } from '#/stores/charts'
import ChartDataEditor from './ChartDataEditor.vue'
import ChartTypeSelector from './ChartTypeSelector.vue'
import { defaultChartData, type AvnacChartData, type ChartType } from '#/lib/avnac-chart-data'

const store = useChartsStore()
const emit = defineEmits<{ insert: [data: AvnacChartData] }>()
const selectedType = ref<ChartType>('bar')
</script>

<style scoped>
.chart-data-panel { padding: 8px; display: flex; flex-direction: column; gap: 12px; }
.chart-insert-header { display: flex; flex-direction: column; gap: 3px; padding: 4px 8px; color: var(--fg-default, #262626); }
.chart-insert-header strong { font-size: 13px; }
.chart-insert-header span { font-size: 11px; color: var(--fg-muted, #71717a); line-height: 1.35; }
.panel-actions { display: flex; justify-content: flex-end; }
.apply-btn {
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: var(--accent, #0070f3);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.apply-btn:hover { opacity: 0.9; }
</style>
