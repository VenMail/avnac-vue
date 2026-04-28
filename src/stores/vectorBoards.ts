import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AvnacVectorBoardMeta } from '#/lib/avnac-vector-boards-storage'
import type { VectorBoardDocument } from '#/lib/avnac-vector-board-document'

export const useVectorBoardsStore = defineStore('vectorBoards', () => {
  const boards = ref<AvnacVectorBoardMeta[]>([])
  const docs = ref<Record<string, VectorBoardDocument>>({})
  const ready = ref(false)
  const activeWorkspaceId = ref<string | null>(null)

  function setBoards(b: AvnacVectorBoardMeta[]) {
    boards.value = b
  }

  function setDoc(id: string, doc: VectorBoardDocument) {
    docs.value = { ...docs.value, [id]: doc }
  }

  function removeDoc(id: string) {
    const next = { ...docs.value }
    delete next[id]
    docs.value = next
    boards.value = boards.value.filter((b) => b.id !== id)
  }

  function openWorkspace(id: string) {
    activeWorkspaceId.value = id
  }

  function closeWorkspace() {
    activeWorkspaceId.value = null
  }

  return {
    boards,
    docs,
    ready,
    activeWorkspaceId,
    setBoards,
    setDoc,
    removeDoc,
    openWorkspace,
    closeWorkspace,
  }
})
