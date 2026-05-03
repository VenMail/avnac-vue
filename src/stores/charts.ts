import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'
import { cloneAvnacPlain } from '#/lib/avnac-document'
import type { AvnacChartData } from '#/lib/avnac-chart-data'

export const useChartsStore = defineStore('charts', () => {
  const editingChartId = ref<string | null>(null)
  const editingChartData = ref<AvnacChartData | null>(null)
  // Increment to trigger re-render of the active chart
  const renderRev = ref(0)

  function openChartEditor(id: string, data: AvnacChartData) {
    editingChartId.value = id
    editingChartData.value = cloneAvnacPlain(toRaw(data))
  }

  function closeChartEditor() {
    editingChartId.value = null
    editingChartData.value = null
  }

  function updateChartData(data: AvnacChartData) {
    editingChartData.value = data
    renderRev.value++
  }

  return { editingChartId, editingChartData, renderRev, openChartEditor, closeChartEditor, updateChartData }
})
