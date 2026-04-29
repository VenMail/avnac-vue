<template>
  <div v-if="store.editingChartData" class="chart-data-panel">
    <ChartDataEditor
      :value="store.editingChartData"
      @update:value="store.updateChartData($event)"
    />
    <div class="panel-actions">
      <button class="apply-btn" @click="store.closeChartEditor()">Done</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChartsStore } from '#/stores/charts'
import ChartDataEditor from './ChartDataEditor.vue'

const store = useChartsStore()
</script>

<style scoped>
.chart-data-panel { padding: 8px; display: flex; flex-direction: column; gap: 12px; }
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
