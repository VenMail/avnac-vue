import { shallowRef, ref, onMounted, onBeforeUnmount } from 'vue'
import type { Canvas, FabricObject } from 'fabric'
import { installAvnacObjectCanvasBlur } from '#/lib/avnac-object-blur'
import { installFabricSelectionChrome, attachFabricHoverOutline } from '#/lib/fabric-selection-chrome'
import { useCanvasStore } from '#/stores/canvas'
import { useHistoryStore } from '#/stores/history'
import { captureAvnacDocument, cloneAvnacPlain, OBJECT_SERIAL_KEYS } from '#/lib/avnac-document'
import { linearGradientForBox } from '#/lib/fabric-linear-gradient'
import { getAvnacShapeMeta, isAvnacStrokeLineLike } from '#/lib/avnac-shape-meta'
import { installArrowEndpointControls } from '#/lib/fabric-line-arrow-controls'

export function useCanvasInit(
  canvasEl: { value: HTMLCanvasElement | null },
) {
  const fabricCanvas = shallowRef<Canvas | null>(null)
  const fabricMod = shallowRef<typeof import('fabric') | null>(null)
  const artboardWRef = ref(4000)
  const artboardHRef = ref(4000)

  const canvasStore = useCanvasStore()
  const historyStore = useHistoryStore()

  let disposed = false
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null
  let lastHistoryJson = ''

  async function initCanvas() {
    const el = canvasEl.value
    if (!el) return

    let mod: typeof import('fabric') | null = null
    try {
      mod = await import('fabric')
    } catch (err) {
      console.error('useCanvasInit: failed to load fabric', err)
      return
    }

    if (disposed || !canvasEl.value) return

    try {
      mod.config.configure({
        maxCacheSideLimit: 8192,
        perfLimitSizeTotal: 16 * 1024 * 1024,
      })
      Object.assign(mod.IText.ownDefaults, { objectCaching: false })

      for (const k of OBJECT_SERIAL_KEYS) {
        if (!mod.FabricObject.customProperties.includes(k)) {
          mod.FabricObject.customProperties.push(k)
        }
      }

      installAvnacObjectCanvasBlur(mod)
      installFabricSelectionChrome(mod)
      fabricMod.value = mod
    } catch (err) {
      console.error('useCanvasInit: failed to configure fabric', err)
      return
    }

    const canvas = new mod.Canvas(el, {
      width: artboardWRef.value,
      height: artboardHRef.value,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    })

    if (disposed) {
      void canvas.dispose()
      fabricMod.value = null
      return
    }

    fabricCanvas.value = canvas
    attachFabricHoverOutline(canvas)

    // Capture initial history snapshot
    const initialDoc = captureAvnacDocument(canvas, {
      w: artboardWRef.value,
      h: artboardHRef.value,
      bgValue: canvasStore.bgValue,
    })
    resetHistory(initialDoc)

    // Track mutations → history
    canvas.on('object:modified', () => {
      if (historyStore.applying) return
      schedulePersist(canvas)
    })

    canvas.on('object:added', () => {
      if (historyStore.applying) return
      schedulePersist(canvas)
    })

    canvas.on('object:removed', () => {
      if (historyStore.applying) return
      schedulePersist(canvas)
    })

    canvasStore.ready = true
    canvasStore.zoomPercent = 100
  }

  function captureCurrentDocument(canvas: Canvas) {
    return captureAvnacDocument(canvas, {
      w: artboardWRef.value,
      h: artboardHRef.value,
      bgValue: canvasStore.bgValue,
    })
  }

  function pushHistoryDocument(doc: ReturnType<typeof captureAvnacDocument>) {
    const json = JSON.stringify(doc)
    if (json === lastHistoryJson) return
    lastHistoryJson = json
    historyStore.push(doc)
  }

  function resetHistory(doc: ReturnType<typeof captureAvnacDocument>) {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer)
      autosaveTimer = null
    }
    lastHistoryJson = JSON.stringify(doc)
    historyStore.init(cloneAvnacPlain(doc))
  }

  async function runWithoutHistory<T>(fn: () => T | Promise<T>): Promise<T> {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer)
      autosaveTimer = null
    }
    const wasApplying = historyStore.applying
    historyStore.applying = true
    try {
      return await fn()
    } finally {
      historyStore.applying = wasApplying
    }
  }

  function schedulePersist(canvas: Canvas) {
    if (autosaveTimer) clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => {
      pushHistoryDocument(captureCurrentDocument(canvas))
    }, 300)
  }

  async function applyDocument(doc: ReturnType<typeof captureAvnacDocument>) {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return

    await runWithoutHistory(async () => {
      canvas.clear()

      canvasStore.bgValue = doc.bg
      artboardWRef.value = doc.artboard.width
      artboardHRef.value = doc.artboard.height
      if (doc.bg.type === 'solid') {
        canvas.backgroundColor = doc.bg.color
      } else {
        canvas.backgroundColor = linearGradientForBox(
          mod,
          doc.bg.stops,
          doc.bg.angle,
          doc.artboard.width,
          doc.artboard.height,
        )
      }

      const objects = await mod.util.enlivenObjects(
        (doc.fabric as { objects?: unknown[] }).objects ?? [],
      )
      objects.forEach((o) => canvas.add(o as FabricObject))
      objects.forEach((o) => restoreObjectControls(o as FabricObject))
      canvas.requestRenderAll()
    })
  }

  function restoreObjectControls(obj: FabricObject) {
    const mod = fabricMod.value
    if (!mod) return
    const meta = getAvnacShapeMeta(obj)
    if (meta && isAvnacStrokeLineLike(meta) && obj instanceof mod.Group) {
      installArrowEndpointControls(obj)
    }
  }

  function undo() {
    const doc = historyStore.undo()
    if (doc) applyDocument(doc)
  }

  function redo() {
    const doc = historyStore.redo()
    if (doc) applyDocument(doc)
  }

  onMounted(() => {
    void initCanvas()
  })

  onBeforeUnmount(() => {
    disposed = true
    if (autosaveTimer) clearTimeout(autosaveTimer)
    void fabricCanvas.value?.dispose()
    fabricCanvas.value = null
    fabricMod.value = null
    canvasStore.ready = false
  })

  return {
    fabricCanvas,
    fabricMod,
    artboardWRef,
    artboardHRef,
    undo,
    redo,
    applyDocument,
    schedulePersist,
    resetHistory,
    runWithoutHistory,
  }
}
