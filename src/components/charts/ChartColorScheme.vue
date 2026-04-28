<template>
  <div class="chart-color-scheme">
    <div class="presets">
      <button
        v-for="(scheme, i) in PRESETS"
        :key="i"
        class="preset-btn"
        :title="scheme.name"
        @click="$emit('change', scheme.colors)"
      >
        <span
          v-for="(c, ci) in scheme.colors.slice(0, 4)"
          :key="ci"
          class="swatch"
          :style="{ background: c }"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ change: [colors: string[]] }>()

const PRESETS = [
  { name: 'Office', colors: ['#4472c4', '#ed7d31', '#a9d18e', '#ffc000', '#70ad47', '#ff0000'] },
  { name: 'Ocean', colors: ['#0070f3', '#00b0f0', '#00d4aa', '#7c3aed', '#e11d48', '#f59e0b'] },
  { name: 'Pastel', colors: ['#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2', '#b8e0d2', '#d6eadf'] },
  { name: 'Bold', colors: ['#e63946', '#2a9d8f', '#e9c46a', '#264653', '#f4a261', '#457b9d'] },
  { name: 'Mono', colors: ['#111', '#333', '#555', '#777', '#999', '#bbb'] },
  { name: 'Warm', colors: ['#ff6b6b', '#ffa500', '#ffd93d', '#ff8c42', '#c62a2a', '#8b0000'] },
]
</script>

<style scoped>
.chart-color-scheme { padding: 4px 0; }
.presets { display: flex; flex-wrap: wrap; gap: 6px; }
.preset-btn {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 3px;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 5px;
  background: var(--surface-raised, #fff);
  cursor: pointer;
}
.preset-btn:hover { border-color: var(--accent, #0070f3); }
.swatch { width: 12px; height: 20px; border-radius: 2px; }
</style>
