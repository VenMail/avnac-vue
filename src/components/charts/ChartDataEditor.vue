<template>
  <div class="chart-data-editor">
    <div class="editor-section">
      <div class="section-label">Chart type</div>
      <ChartTypeSelector
        :model-value="value.type"
        @update:model-value="patch({ type: $event })"
      />
    </div>

    <div class="editor-section">
      <div class="section-label">Data</div>
      <ChartDataGrid
        :labels="value.labels"
        :series="value.series"
        @update:labels="patch({ labels: $event })"
        @update:series="patch({ series: $event })"
      />
    </div>

    <div class="editor-section">
      <div class="section-label">Color scheme</div>
      <ChartColorScheme @change="patch({ options: { ...value.options, colorScheme: $event } })" />
    </div>

    <div class="editor-section options-row">
      <label class="option-toggle">
        <input
          type="checkbox"
          :checked="value.options.showLegend"
          @change="patch({ options: { ...value.options, showLegend: !value.options.showLegend } })"
        />
        Show legend
      </label>
      <label class="option-toggle">
        <input
          type="checkbox"
          :checked="value.options.showDataLabels"
          @change="patch({ options: { ...value.options, showDataLabels: !value.options.showDataLabels } })"
        />
        Show values
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AvnacChartData } from '#/lib/avnac-chart-data'
import ChartTypeSelector from './ChartTypeSelector.vue'
import ChartDataGrid from './ChartDataGrid.vue'
import ChartColorScheme from './ChartColorScheme.vue'

const props = defineProps<{ value: AvnacChartData }>()
const emit = defineEmits<{ 'update:value': [v: AvnacChartData] }>()

function patch(partial: Partial<AvnacChartData>) {
  emit('update:value', { ...props.value, ...partial })
}
</script>

<style scoped>
.chart-data-editor { display: flex; flex-direction: column; gap: 12px; }
.editor-section { display: flex; flex-direction: column; gap: 4px; }
.section-label { font-size: 11px; font-weight: 600; color: var(--fg-muted, #666); text-transform: uppercase; letter-spacing: 0.05em; }
.options-row { flex-direction: row; gap: 12px; }
.option-toggle { display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; }
</style>
