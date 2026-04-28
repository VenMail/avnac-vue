<template>
  <div v-if="store.editingChartData" class="chart-data-panel">
    <div class="panel-section">
      <div class="section-label">Chart type</div>
      <ChartTypeSelector
        :model-value="store.editingChartData.type"
        @update:model-value="onTypeChange"
      />
    </div>

    <div class="panel-section">
      <div class="section-label">Data</div>
      <ChartDataGrid
        :labels="store.editingChartData.labels"
        :series="store.editingChartData.series"
        @update:labels="onLabelsChange"
        @update:series="onSeriesChange"
      />
    </div>

    <div class="panel-section">
      <div class="section-label">Color scheme</div>
      <ChartColorScheme @change="onColorSchemeChange" />
    </div>

    <div class="panel-section options-row">
      <label class="option-toggle">
        <input type="checkbox" :checked="store.editingChartData.options.showLegend" @change="onOptionToggle('showLegend')" />
        Show legend
      </label>
      <label class="option-toggle">
        <input type="checkbox" :checked="store.editingChartData.options.showDataLabels" @change="onOptionToggle('showDataLabels')" />
        Show values
      </label>
    </div>

    <div class="panel-actions">
      <button class="apply-btn" @click="store.closeChartEditor()">Done</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChartsStore } from '#/stores/charts'
import type { AvnacChartData, ChartType } from '#/lib/avnac-chart-data'
import ChartTypeSelector from './ChartTypeSelector.vue'
import ChartDataGrid from './ChartDataGrid.vue'
import ChartColorScheme from './ChartColorScheme.vue'

const store = useChartsStore()

function patch(partial: Partial<AvnacChartData>) {
  if (!store.editingChartData) return
  store.updateChartData({ ...store.editingChartData, ...partial })
}

function onTypeChange(type: ChartType) {
  patch({ type })
}

function onLabelsChange(labels: string[]) {
  patch({ labels })
}

function onSeriesChange(series: AvnacChartData['series']) {
  patch({ series })
}

function onColorSchemeChange(colors: string[]) {
  if (!store.editingChartData) return
  patch({ options: { ...store.editingChartData.options, colorScheme: colors } })
}

function onOptionToggle(key: 'showLegend' | 'showDataLabels') {
  if (!store.editingChartData) return
  patch({ options: { ...store.editingChartData.options, [key]: !store.editingChartData.options[key] } })
}
</script>

<style scoped>
.chart-data-panel { padding: 8px; display: flex; flex-direction: column; gap: 12px; }
.panel-section { display: flex; flex-direction: column; gap: 4px; }
.section-label { font-size: 11px; font-weight: 600; color: var(--fg-muted, #666); text-transform: uppercase; letter-spacing: 0.05em; }
.options-row { flex-direction: row; gap: 12px; }
.option-toggle { display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; }
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
