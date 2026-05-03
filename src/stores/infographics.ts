import { defineStore } from 'pinia'
import { ref } from 'vue'
import { cloneAvnacPlain } from '#/lib/avnac-document'
import type { AvnacInfographicData } from '#/lib/avnac-infographic'

export const useInfographicsStore = defineStore('infographics', () => {
  // objectId → infographic data (for re-render on edit)
  const dataMap = ref<Map<string, AvnacInfographicData>>(new Map())
  const editingId = ref<string | null>(null)
  const editingData = ref<AvnacInfographicData | null>(null)

  function register(id: string, data: AvnacInfographicData) {
    dataMap.value.set(id, data)
  }

  function openEditor(id: string, data: AvnacInfographicData) {
    editingId.value = id
    editingData.value = cloneAvnacPlain(data)
    dataMap.value.set(id, data)
  }

  function closeEditor() {
    editingId.value = null
    editingData.value = null
  }

  function updateData(data: AvnacInfographicData) {
    editingData.value = data
    if (editingId.value) dataMap.value.set(editingId.value, data)
  }

  function getById(id: string): AvnacInfographicData | undefined {
    return dataMap.value.get(id)
  }

  return { dataMap, editingId, editingData, register, openEditor, closeEditor, updateData, getById }
})
