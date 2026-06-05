import { computed, onScopeDispose, ref, watch } from 'vue'
import type { ShallowRef } from 'vue'
import type { Canvas, FabricObject } from 'fabric'
import { getAvnacLayerName, setAvnacLayerName, ensureAvnacLayerId } from '#/lib/ensure-avnac-layer-id'
import { useCanvasStore } from '#/stores/canvas'

export interface LayerRow {
  id: string
  index: number
  label: string
  visible: boolean
  selected: boolean
}

function fabricObjectLabel(obj: FabricObject): string {
  const type = (obj as { type?: string }).type ?? 'object'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function useLayerPanel(
  fabricCanvas: ShallowRef<Canvas | null>,
) {
  const canvasStore = useCanvasStore()
  const revision = ref(0)
  const bumpRevision = () => { revision.value += 1 }

  watch(fabricCanvas, (canvas, _previous, onCleanup) => {
    if (!canvas) return
    const events = [
      'object:added',
      'object:removed',
      'object:modified',
      'selection:created',
      'selection:updated',
      'selection:cleared',
    ]
    events.forEach((event) => canvas.on(event as never, bumpRevision as never))
    bumpRevision()
    onCleanup(() => {
      events.forEach((event) => canvas.off(event as never, bumpRevision as never))
    })
  }, { immediate: true })

  onScopeDispose(() => {
    const canvas = fabricCanvas.value
    if (!canvas) return
    ;[
      'object:added',
      'object:removed',
      'object:modified',
      'selection:created',
      'selection:updated',
      'selection:cleared',
    ].forEach((event) => canvas.off(event as never, bumpRevision as never))
  })

  const layers = computed<LayerRow[]>(() => {
    revision.value
    const canvas = fabricCanvas.value
    if (!canvas) return []
    const objects = canvas.getObjects()
    const selected = new Set(canvas.getActiveObjects())
    return objects.map((obj, i) => ({
      id: ensureAvnacLayerId(obj),
      index: i,
      label: getAvnacLayerName(obj) ?? fabricObjectLabel(obj),
      visible: obj.visible ?? true,
      selected: selected.has(obj),
    })).reverse() // top layer first in UI
  })

  function toggleVisible(stackIndex: number) {
    const canvas = fabricCanvas.value
    if (!canvas) return
    const objects = canvas.getObjects()
    const obj = objects[stackIndex]
    if (!obj) return
    obj.visible = !(obj.visible ?? true)
    canvas.requestRenderAll()
    bumpRevision()
  }

  function renameLayer(stackIndex: number, name: string) {
    const canvas = fabricCanvas.value
    if (!canvas) return
    const obj = canvas.getObjects()[stackIndex]
    if (!obj) return
    setAvnacLayerName(obj, name)
    bumpRevision()
  }

  function bringForward(stackIndex: number) {
    const canvas = fabricCanvas.value
    if (!canvas) return
    const obj = canvas.getObjects()[stackIndex]
    if (!obj) return
    canvas.bringObjectForward(obj)
    canvas.requestRenderAll()
    bumpRevision()
  }

  function sendBackward(stackIndex: number) {
    const canvas = fabricCanvas.value
    if (!canvas) return
    const obj = canvas.getObjects()[stackIndex]
    if (!obj) return
    canvas.sendObjectBackwards(obj)
    canvas.requestRenderAll()
    bumpRevision()
  }

  function reorderById(orderedIds: string[]) {
    const canvas = fabricCanvas.value
    if (!canvas) return
    const objects = canvas.getObjects()
    const byId = new Map<string, FabricObject>()
    objects.forEach((o) => {
      const id = ensureAvnacLayerId(o)
      byId.set(id, o)
    })
    // orderedIds is top-to-bottom in UI → reverse for canvas z-order (bottom first)
    const bottomFirst = [...orderedIds].reverse()
    // Remove all, then re-add in order
    const toAdd = bottomFirst.map((id) => byId.get(id)).filter(Boolean) as FabricObject[]
    canvas.discardActiveObject()
    canvasStore.clearSelection()   // sync store so toolbar hides after reorder
    toAdd.forEach((o) => canvas.remove(o))
    toAdd.forEach((o, i) => canvas.insertAt(i, o))
    canvas.requestRenderAll()
    bumpRevision()
  }

  function deleteSelected() {
    const canvas = fabricCanvas.value
    if (!canvas) return
    const active = canvas.getActiveObjects()
    canvas.discardActiveObject()
    active.forEach((o) => canvas.remove(o))
    canvas.requestRenderAll()
    bumpRevision()
  }

  function selectByIndex(stackIndex: number) {
    const canvas = fabricCanvas.value
    if (!canvas) return
    const obj = canvas.getObjects()[stackIndex]
    if (!obj) return
    canvas.setActiveObject(obj)
    canvas.requestRenderAll()
    bumpRevision()
  }

  return {
    layers,
    toggleVisible,
    renameLayer,
    bringForward,
    sendBackward,
    reorderById,
    deleteSelected,
    selectByIndex,
  }
}
