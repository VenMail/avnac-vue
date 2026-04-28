import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AvnacDocumentV1 } from '#/lib/avnac-document'

const MAX_HISTORY = 100

export const useHistoryStore = defineStore('history', () => {
  const snapshots = ref<AvnacDocumentV1[]>([])
  const index = ref(-1)
  const applying = ref(false)

  const canUndo = computed(() => index.value > 0)
  const canRedo = computed(() => index.value < snapshots.value.length - 1)

  function init(doc: AvnacDocumentV1) {
    snapshots.value = [doc]
    index.value = 0
  }

  function push(doc: AvnacDocumentV1) {
    if (applying.value) return
    // Discard forward history on new mutation
    snapshots.value = snapshots.value.slice(0, index.value + 1)
    snapshots.value.push(doc)
    if (snapshots.value.length > MAX_HISTORY) {
      snapshots.value.shift()
    }
    index.value = snapshots.value.length - 1
  }

  function undo(): AvnacDocumentV1 | null {
    if (!canUndo.value) return null
    index.value--
    return snapshots.value[index.value] ?? null
  }

  function redo(): AvnacDocumentV1 | null {
    if (!canRedo.value) return null
    index.value++
    return snapshots.value[index.value] ?? null
  }

  function reset() {
    snapshots.value = []
    index.value = -1
  }

  return { snapshots, index, applying, canUndo, canRedo, init, push, undo, redo, reset }
})
