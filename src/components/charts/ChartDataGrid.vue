<template>
  <div class="chart-data-grid" @paste.capture="onGridPaste">
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
          @input="onSeriesName(si, ($event.target as HTMLInputElement).value)"
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
          @focus="focusCell = { row: ri, col: -1 }"
          @input="onLabelChange(ri, ($event.target as HTMLInputElement).value)"
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
          @focus="focusCell = { row: ri, col: si }"
          @input="onValueChange(ri, si, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <button class="add-row-btn" @click="addRow">+ Add row</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AvnacChartSeries } from '#/lib/avnac-chart-data'

const props = defineProps<{
  labels: string[]
  series: AvnacChartSeries[]
}>()

const emit = defineEmits<{
  'update:labels': [v: string[]]
  'update:series': [v: AvnacChartSeries[]]
}>()

// Track which cell is focused so paste knows where to start.
const focusCell = ref<{ row: number; col: number } | null>(null)

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

function onGridPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text')
  if (!text) return

  // Parse TSV: rows split by \n, cells split by \t
  const rows = text.trimEnd().split(/\r?\n/).map(r => r.split('\t'))
  if (!rows.length) return

  e.preventDefault()

  const startRow = focusCell.value?.row ?? 0
  const startCol = focusCell.value?.col ?? -1  // -1 = label column

  // Build mutable copies
  const newLabels = [...props.labels]
  const newSeries = props.series.map(s => ({ ...s, data: [...s.data] }))

  for (let dr = 0; dr < rows.length; dr++) {
    const absRow = startRow + dr
    const cells = rows[dr]

    // Expand rows if needed
    while (newLabels.length <= absRow) {
      newLabels.push(`Item ${newLabels.length + 1}`)
      newSeries.forEach(s => s.data.push(0))
    }

    let cellIdx = 0

    if (startCol === -1) {
      // Paste starts in label column
      newLabels[absRow] = cells[cellIdx] ?? newLabels[absRow]
      cellIdx++
    }

    // Fill series columns
    for (let dc = cellIdx; dc < cells.length; dc++) {
      const absCol = startCol === -1 ? dc - 1 : startCol + dc
      if (absCol < 0) continue
      // Expand series if needed
      while (newSeries.length <= absCol) {
        newSeries.push({
          name: `Series ${newSeries.length + 1}`,
          data: newLabels.map(() => 0),
        })
      }
      const val = parseFloat(cells[dc])
      if (!isNaN(val)) newSeries[absCol].data[absRow] = val
    }
  }

  emit('update:labels', newLabels)
  emit('update:series', newSeries)
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
