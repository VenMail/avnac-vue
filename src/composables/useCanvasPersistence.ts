import type { ShallowRef } from 'vue'
import type { Canvas } from 'fabric'
import { captureAvnacDocument } from '#/lib/avnac-document'
import { idbPutDocument, idbGetDocument } from '#/lib/avnac-editor-idb'
import { useCanvasStore } from '#/stores/canvas'

const AUTOSAVE_DELAY = 800

export function useCanvasPersistence(
  fabricCanvas: ShallowRef<Canvas | null>,
  artboardWRef: { value: number },
  artboardHRef: { value: number },
  persistId: { value: string | undefined },
  persistDisplayName: { value: string },
) {
  const canvasStore = useCanvasStore()
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null

  async function loadFromIdb(id: string) {
    const record = await idbGetDocument(id)
    return record
  }

  function scheduleAutosave() {
    const canvas = fabricCanvas.value
    const id = persistId.value
    if (!canvas || !id) return
    if (autosaveTimer) clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(async () => {
      const doc = captureAvnacDocument(canvas, {
        w: artboardWRef.value,
        h: artboardHRef.value,
        bgValue: canvasStore.bgValue,
      })
      await idbPutDocument(id, doc, { name: persistDisplayName.value })
    }, AUTOSAVE_DELAY)
  }

  function attachPersistenceListeners(canvas: Canvas) {
    canvas.on('object:modified', scheduleAutosave)
    canvas.on('object:added', scheduleAutosave)
    canvas.on('object:removed', scheduleAutosave)
  }

  function cancelAutosave() {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer)
      autosaveTimer = null
    }
  }

  return {
    loadFromIdb,
    scheduleAutosave,
    attachPersistenceListeners,
    cancelAutosave,
  }
}
