<template>
  <div class="inf-panel">
    <template v-if="!store.editingId">
      <div class="section-label">Choose template</div>
      <InfographicTemplateGrid
        :model-value="selectedTemplate"
        @update:model-value="onTemplateSelect"
      />
    </template>

    <template v-else>
      <div class="editor-header">
        <span class="template-name">{{ store.editingData?.template }}</span>
        <button class="back-btn" @click="store.closeEditor()">← Back</button>
      </div>
      <InfographicDataEditor
        v-if="store.editingData"
        :model-value="store.editingData"
        @update:model-value="store.updateData($event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useInfographicsStore } from '#/stores/infographics'
import type { InfographicTemplate } from '#/lib/avnac-infographic'
import { defaultInfographicData } from '#/lib/avnac-infographic'
import InfographicTemplateGrid from './InfographicTemplateGrid.vue'
import InfographicDataEditor from './InfographicDataEditor.vue'

const store = useInfographicsStore()
const selectedTemplate = ref<InfographicTemplate | null>(null)

const emit = defineEmits<{ insert: [data: ReturnType<typeof defaultInfographicData>] }>()

function onTemplateSelect(template: InfographicTemplate) {
  selectedTemplate.value = template
  const data = defaultInfographicData(template)
  emit('insert', data)
}
</script>

<style scoped>
.inf-panel { padding: 8px; display: flex; flex-direction: column; gap: 8px; }
.section-label { font-size: 11px; font-weight: 600; color: var(--fg-muted, #666); text-transform: uppercase; letter-spacing: 0.05em; }
.editor-header { display: flex; align-items: center; justify-content: space-between; }
.template-name { font-size: 12px; font-weight: 600; text-transform: capitalize; color: var(--fg-default, #262626); }
.back-btn { font-size: 11px; color: var(--accent, #0070f3); border: none; background: transparent; cursor: pointer; }
</style>
