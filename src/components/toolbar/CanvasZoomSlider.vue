<template>
  <div class="avnac-zoom-bar">
    <EditorRangeSlider
      :value="value"
      :min="min"
      :max="max"
      :disabled="disabled"
      aria-label="Zoom"
      track-class-name="w-24"
      @change="emit('change', $event)"
    />
    <button
      v-if="onFitRequest"
      class="avnac-zoom-pct-btn"
      title="Drag to zoom. Click the percentage to fit the page in view."
      :disabled="disabled"
      @click="emit('fitRequest')"
    >{{ value }}%</button>
    <span v-else class="avnac-zoom-pct-text">{{ value }}%</span>
  </div>
</template>

<script setup lang="ts">
import EditorRangeSlider from '#/components/shared/EditorRangeSlider.vue'

withDefaults(defineProps<{
  value: number
  min?: number
  max?: number
  disabled?: boolean
  onFitRequest?: (() => void) | null
}>(), { min: 5, max: 400, disabled: false, onFitRequest: null })

const emit = defineEmits<{ change: [v: number]; fitRequest: [] }>()
</script>

<style scoped>
.avnac-zoom-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 8px;
  padding: 4px 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.avnac-zoom-pct-btn {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding: 2px 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  min-width: 3rem;
  text-align: center;
}
.avnac-zoom-pct-btn:hover:not(:disabled) { background: var(--bg-subtle, #f0f0f0); }
.avnac-zoom-pct-text {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  min-width: 3rem;
  text-align: center;
}
</style>
