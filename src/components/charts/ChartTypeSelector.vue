<template>
  <div class="chart-type-selector">
    <div class="chart-type-grid">
      <button
        v-for="ct in CHART_TYPES"
        :key="ct.type"
        class="chart-type-btn"
        :class="{ active: modelValue === ct.type }"
        :title="ct.label"
        @click="$emit('update:modelValue', ct.type)"
      >
        <svg :viewBox="ct.viewBox" width="32" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path :d="ct.path" />
        </svg>
        <span>{{ ct.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartType } from '#/lib/avnac-chart-data'

defineProps<{ modelValue: ChartType }>()
defineEmits<{ 'update:modelValue': [v: ChartType] }>()

const CHART_TYPES: Array<{ type: ChartType; label: string; path: string; viewBox: string }> = [
  {
    type: 'bar', label: 'Bar',
    viewBox: '0 0 32 24',
    path: 'M4 20h4V10H4zM12 20h4V6H12zM20 20h4V13H20z',
  },
  {
    type: 'bar-stacked', label: 'Stacked Bar',
    viewBox: '0 0 32 24',
    path: 'M4 20h4v-6H4v6zm0-6h4V8H4v6zM12 20h4v-4H12v4zm0-4h4V8H12v8zM20 20h4v-8H20v8zm0-8h4V4H20v8z',
  },
  {
    type: 'line', label: 'Line',
    viewBox: '0 0 32 24',
    path: 'M2 18l8-8 6 4 8-10',
  },
  {
    type: 'area', label: 'Area',
    viewBox: '0 0 32 24',
    path: 'M2 20l8-8 6 4 8-10v14H2z',
  },
  {
    type: 'pie', label: 'Pie',
    viewBox: '0 0 32 24',
    path: 'M16 4v8h8a8 8 0 1 1-8-8z M16 4a8 8 0 0 1 8 8h-8z',
  },
  {
    type: 'doughnut', label: 'Doughnut',
    viewBox: '0 0 32 24',
    path: 'M16 4a8 8 0 1 1 0 16A8 8 0 0 1 16 4zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  },
  {
    type: 'scatter', label: 'Scatter',
    viewBox: '0 0 32 24',
    path: 'M6 16m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0zM14 10m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0zM22 7m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0z',
  },
  {
    type: 'radar', label: 'Radar',
    viewBox: '0 0 32 24',
    path: 'M16 3l3 8h8l-6.5 5 2.5 8L16 19l-7 5 2.5-8L5 11h8z',
  },
]
</script>

<style scoped>
.chart-type-selector { padding: 8px; }
.chart-type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.chart-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 8px;
  background: var(--surface-raised, #fff);
  cursor: pointer;
  font-size: 10px;
  color: var(--fg-muted, #666);
  transition: border-color 0.15s, background 0.15s;
}
.chart-type-btn:hover { background: var(--bg-subtle, #f5f5f5); }
.chart-type-btn.active {
  border-color: var(--accent, #0070f3);
  background: var(--accent-subtle, #e8f0ff);
  color: var(--accent, #0070f3);
}
</style>
