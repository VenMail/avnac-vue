<template>
  <div class="inf-data-editor">
    <div class="items-list">
      <div
        v-for="(item, i) in modelValue.items"
        :key="i"
        class="item-row"
      >
        <span
          class="item-swatch"
          :style="{ background: colorAt(i) }"
        />
        <div class="item-fields">
          <input
            class="item-input"
            :value="item.label"
            placeholder="Label"
            @change="updateItem(i, 'label', ($event.target as HTMLInputElement).value)"
          />
          <input
            class="item-input sublabel"
            :value="item.sublabel ?? ''"
            placeholder="Sublabel (optional)"
            @change="updateItem(i, 'sublabel', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <input
          v-if="modelValue.options.showValues"
          class="item-input value-input"
          :value="item.value ?? ''"
          placeholder="Value"
          @change="updateItem(i, 'value', ($event.target as HTMLInputElement).value)"
        />
        <button class="del-btn" title="Remove item" @click="removeItem(i)">×</button>
      </div>
    </div>

    <button class="add-btn" @click="addItem">+ Add item</button>

    <div class="options-row">
      <label class="option-toggle">
        <input type="checkbox" :checked="modelValue.options.showLabels" @change="toggleOption('showLabels')" />
        Labels
      </label>
      <label class="option-toggle">
        <input type="checkbox" :checked="modelValue.options.showValues" @change="toggleOption('showValues')" />
        Values
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AvnacInfographicData, InfographicItem } from '#/lib/avnac-infographic'

const props = defineProps<{ modelValue: AvnacInfographicData }>()
const emit = defineEmits<{ 'update:modelValue': [v: AvnacInfographicData] }>()

function colorAt(i: number): string {
  const { colorScheme } = props.modelValue.options
  return colorScheme[i % colorScheme.length] ?? '#4472c4'
}

function patch(partial: Partial<AvnacInfographicData>) {
  emit('update:modelValue', { ...props.modelValue, ...partial })
}

function updateItem(i: number, key: keyof InfographicItem, val: string) {
  const items = props.modelValue.items.map((item, idx) =>
    idx === i ? { ...item, [key]: val } : item,
  )
  patch({ items })
}

function removeItem(i: number) {
  patch({ items: props.modelValue.items.filter((_, idx) => idx !== i) })
}

function addItem() {
  patch({
    items: [...props.modelValue.items, { label: `Item ${props.modelValue.items.length + 1}` }],
  })
}

function toggleOption(key: 'showLabels' | 'showValues') {
  patch({ options: { ...props.modelValue.options, [key]: !props.modelValue.options[key] } })
}
</script>

<style scoped>
.inf-data-editor { display: flex; flex-direction: column; gap: 6px; }
.items-list { display: flex; flex-direction: column; gap: 4px; }
.item-row { display: flex; align-items: flex-start; gap: 4px; }
.item-swatch { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
.item-fields { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.item-input {
  width: 100%;
  padding: 3px 6px;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 4px;
  font-size: 11px;
  background: var(--surface-raised, #fff);
  color: var(--fg-default, #262626);
}
.item-input.sublabel { opacity: 0.7; }
.item-input.value-input { width: 52px; flex-shrink: 0; }
.del-btn {
  padding: 0 4px;
  border: none; background: transparent;
  color: var(--fg-muted, #999); cursor: pointer; font-size: 16px; line-height: 1;
  margin-top: 2px;
}
.del-btn:hover { color: var(--fg-default, #262626); }
.add-btn {
  padding: 4px 10px;
  border: 1px dashed var(--border-default, #ccc);
  border-radius: 4px; background: transparent; cursor: pointer;
  font-size: 11px; color: var(--fg-muted, #666);
}
.add-btn:hover { background: var(--bg-subtle, #f5f5f5); }
.options-row { display: flex; gap: 12px; }
.option-toggle { display: flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; }
</style>
