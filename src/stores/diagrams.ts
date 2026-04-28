import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AvnacDiagramData } from '#/lib/avnac-diagram'

export const useDiagramsStore = defineStore('diagrams', () => {
  const dataMap = ref<Map<string, AvnacDiagramData>>(new Map())
  const editingId = ref<string | null>(null)
  const editingData = ref<AvnacDiagramData | null>(null)
  // Whether we're in diagram edit mode (node/edge selection active on canvas)
  const diagramEditMode = ref(false)

  function openEditor(id: string, data: AvnacDiagramData) {
    editingId.value = id
    editingData.value = structuredClone(data)
    dataMap.value.set(id, data)
  }

  function closeEditor() {
    editingId.value = null
    editingData.value = null
    diagramEditMode.value = false
  }

  function updateData(data: AvnacDiagramData) {
    editingData.value = data
    if (editingId.value) dataMap.value.set(editingId.value, data)
  }

  function enterEditMode(id: string) {
    editingId.value = id
    diagramEditMode.value = true
  }

  function exitEditMode() {
    diagramEditMode.value = false
  }

  function register(id: string, data: AvnacDiagramData) {
    dataMap.value.set(id, data)
  }

  function getById(id: string): AvnacDiagramData | undefined {
    return dataMap.value.get(id)
  }

  return {
    dataMap, editingId, editingData, diagramEditMode,
    openEditor, closeEditor, updateData,
    enterEditMode, exitEditMode, register, getById,
  }
})
