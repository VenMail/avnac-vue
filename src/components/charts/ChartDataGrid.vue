<template>
  <div class="chart-data-grid">
    <!-- Header row: empty corner + series names -->
    <div class="grid-row header-row">
      <div class="cell label-cell"></div>
      <div
        v-for="(s, si) in series"
        :key="'sh-' + si"
        class="cell series-header"
      >
        <input
          class="cell-input"
          :value="s.name"
          @change="onSeriesName(si, ($event.target as HTMLInputElement).value)"
        />
        <button class="del-btn" title="Remove series" @click="removeSeries(si)">×</button>
      </div>
      <button class="add-btn" @click="addSeries">+</button>
    </div>

    <!-- Data rows: one per label -->
    <div
      v-for="(label, ri) in labels"
      :key="'row-' + ri"
      class="grid-row"
    >
      <div class="cell label-cell">
        <input
          class="cell-input"
          :value="label"
          @change="onLabelChange(ri, ($event.target as HTMLInputElement).value)"
        />
        <button class="del-btn" title="Remove row" @click="removeRow(ri)">×</button>
      </div>
      <div
        v-for="(s, si) in series"
        :key="'cell-' + ri + '-' + si"
        class="cell"
      >
        <input
          type="number"
          class="cell-input numeric"
          :value="s.data[ri] ?? 0"
          @change="onValueChange(ri, si, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <button class="add-row-btn" @click="addRow">+ Add row</button>
  </div>
</template>

<script setup lang="ts">
import type { AvnacChartSeries } from '#/lib/avnac-chart-data'

const props = defineProps<{
  labels: string[]
  series: AvnacChartSeries[]
}>()

const emit = defineEmits<{
  'update:labels': [v: string[]]
  'update:series': [v: AvnacChartSeries[]]
}>()

function onLabelChange(ri: number, val: string) {
  const updated = [...props.labels]
  updated[ri] = val
  emit('update:labels', updated)
}

function onSeriesName(si: number, val: string) {
  const updated = props.series.map((s, i) => i === si ? { ...s, name: val } : s)
  emit('update:series', updated)
}

function onValueChange(ri: number, si: number, raw: string) {
  const val = parseFloat(raw) || 0
  const updated = props.series.map((s, i) => {
    if (i !== si) return s
    const data = [...s.data]
    data[ri] = val
    return { ...s, data }
  })
  emit('update:series', updated)
}

function addSeries() {
  const updated = [...props.series, {
    name: `Series ${props.series.length + 1}`,
    data: props.labels.map(() => Math.round(Math.random() * 80 + 10)),
  }]
  emit('update:series', updated)
}

function removeSeries(si: number) {
  emit('update:series', props.series.filter((_, i) => i !== si))
}

function addRow() {
  emit('update:labels', [...props.labels, `Item ${props.labels.length + 1}`])
  emit('update:series', props.series.map(s => ({ ...s, data: [...s.data, 0] })))
}

function removeRow(ri: number) {
  emit('update:labels', props.labels.filter((_, i) => i !== ri))
  emit('update:series', props.series.map(s => ({ ...s, data: s.data.filter((_, i) => i !== ri) })))
}
</script>

<style scoped>
.chart-data-grid { font-size: 12px; overflow-x: auto; }
.grid-row { display: flex; align-items: center; gap: 2px; margin-bottom: 2px; }
.header-row { font-weight: 600; }
.cell { display: flex; align-items: center; min-width: 80px; }
.label-cell { min-width: 100px; }
.cell-input {
  width: 100%;
  padding: 3px 5px;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 4px;
  font-size: 11px;
  background: var(--surface-raised, #fff);
  color: var(--fg-default, #262626);
}
.cell-input.numeric { text-align: right; }
.del-btn {
  padding: 0 3px;
  border: none;
  background: transparent;
  color: var(--fg-muted, #999);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
.del-btn:hover { color: var(--fg-default, #262626); }
.add-btn, .add-row-btn {
  padding: 3px 8px;
  border: 1px dashed var(--border-default, #ccc);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  color: var(--fg-muted, #666);
}
.add-btn:hover, .add-row-btn:hover { background: var(--bg-subtle, #f5f5f5); }
.add-row-btn { margin-top: 6px; width: 100%; }
</style>
