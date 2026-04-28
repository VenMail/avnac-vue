<template>
  <div :class="['relative flex items-center', trackClassName]">
    <input
      :id="id"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="value"
      :disabled="disabled"
      :aria-label="ariaLabel"
      class="avnac-range-slider w-full"
      :class="{ 'opacity-40 cursor-not-allowed': disabled }"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  min?: number
  max?: number
  step?: number
  value: number
  disabled?: boolean
  id?: string
  ariaLabel?: string
  trackClassName?: string
}>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  trackClassName: 'w-full min-w-24',
})

const emit = defineEmits<{ change: [value: number] }>()

function onInput(e: Event) {
  emit('change', Number((e.target as HTMLInputElement).value))
}
</script>

<style scoped>
.avnac-range-slider {
  appearance: none;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--border-default, #e0e0e0);
  outline: none;
  cursor: pointer;
}
.avnac-range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--fg-default, #262626);
  cursor: pointer;
  border: none;
}
.avnac-range-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--fg-default, #262626);
  cursor: pointer;
  border: none;
}
</style>
