<template>
  <div ref="viewportRef" class="avnac-editor" tabindex="0" @keydown="onKeyDown">
    <!-- Artboard zoom container -->
    <div
      ref="canvasZoomRef"
      class="avnac-canvas-zoom"
      :style="zoomContainerStyle"
      @click.self="onBackgroundClick"
    >
      <div
        ref="artboardFrameRef"
        class="avnac-artboard-frame"
        :style="artboardFrameStyle"
      >
        <canvas ref="canvasElRef" />
      </div>
    </div>

    <!-- Floating toolbars (rendered when object selected) -->
    <div
      v-if="canvasStore.hasObjectSelected"
      ref="elementToolbarRef"
      class="avnac-element-toolbar"
      :style="elementToolbarStyle"
      data-avnac-chrome="true"
    >
      <slot name="toolbar" />
    </div>

    <!-- Sidebar -->
    <div class="avnac-sidebar" data-avnac-chrome="true">
      <slot name="sidebar" />
    </div>

    <!-- Bottom controls: zoom -->
    <div class="avnac-bottom-bar" data-avnac-chrome="true">
      <slot name="bottom-bar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useCanvasInit } from '#/composables/useCanvasInit'
import { useShapeTools } from '#/composables/useShapeTools'
import { useToolbarSync } from '#/composables/useToolbarSync'
import { useLayerPanel } from '#/composables/useLayerPanel'
import { useCanvasPersistence } from '#/composables/useCanvasPersistence'
import { useCanvasStore } from '#/stores/canvas'
import { captureAvnacDocument, type AvnacDocumentV1 } from '#/lib/avnac-document'
import { linearGradientForBox } from '#/lib/fabric-linear-gradient'
import { getAvnacLocked } from '#/lib/avnac-object-lock'
import { removeActiveObjectFromCanvas } from '#/lib/fabric-remove-selection'

// ────────────────────────────────────────────
// Props / emits
// ────────────────────────────────────────────
const props = withDefaults(defineProps<{
  initialDocument?: AvnacDocumentV1
  persistId?: string
  persistDisplayName?: string
  artboardWidth?: number
  artboardHeight?: number
}>(), {
  artboardWidth: 4000,
  artboardHeight: 4000,
})

const emit = defineEmits<{
  change: [doc: AvnacDocumentV1]
  ready: []
}>()

// ────────────────────────────────────────────
// Template refs
// ────────────────────────────────────────────
const canvasElRef = ref<HTMLCanvasElement | null>(null)
const viewportRef = ref<HTMLDivElement | null>(null)
const artboardFrameRef = ref<HTMLDivElement | null>(null)
const canvasZoomRef = ref<HTMLDivElement | null>(null)
const elementToolbarRef = ref<HTMLDivElement | null>(null)

// ────────────────────────────────────────────
// Composables
// ────────────────────────────────────────────
const canvasStore = useCanvasStore()

const {
  fabricCanvas,
  fabricMod,
  artboardWRef,
  artboardHRef,
  undo,
  redo,
  schedulePersist,
} = useCanvasInit(canvasElRef)

// Set initial artboard size
artboardWRef.value = props.artboardWidth
artboardHRef.value = props.artboardHeight

const shapeTools = useShapeTools(fabricCanvas, fabricMod, artboardWRef, artboardHRef)

const toolbarSync = useToolbarSync(fabricCanvas, fabricMod, artboardWRef)

const layerPanel = useLayerPanel(fabricCanvas)

const persistIdRef = computed(() => props.persistId)
const displayNameRef = computed(() => props.persistDisplayName?.trim() || 'Untitled')

const persistence = useCanvasPersistence(
  fabricCanvas,
  artboardWRef,
  artboardHRef,
  persistIdRef,
  displayNameRef,
)

// ────────────────────────────────────────────
// Zoom / layout — viewport-transform based (no CSS scale)
// Canvas is resized to display dimensions; Fabric viewport transform
// maps artboard coords → canvas coords so text renders at display DPI.
// ────────────────────────────────────────────
const zoomPercent = computed(() => canvasStore.zoomPercent ?? 100)
const scaledW = computed(() => Math.round(artboardWRef.value * zoomPercent.value / 100))
const scaledH = computed(() => Math.round(artboardHRef.value * zoomPercent.value / 100))

const artboardFrameStyle = computed(() => ({
  width: `${scaledW.value}px`,
  height: `${scaledH.value}px`,
}))

const zoomContainerStyle = computed(() => ({
  width: `${scaledW.value}px`,
  height: `${scaledH.value}px`,
}))

function applyFabricZoom() {
  const canvas = fabricCanvas.value
  if (!canvas) return
  const scale = zoomPercent.value / 100
  const w = Math.round(artboardWRef.value * scale)
  const h = Math.round(artboardHRef.value * scale)
  canvas.setDimensions({ width: w, height: h })
  canvas.setViewportTransform([scale, 0, 0, scale, 0, 0])
  canvas.requestRenderAll()
}

watch(zoomPercent, applyFabricZoom)
watch([artboardWRef, artboardHRef], applyFabricZoom)

const elementToolbarStyle = computed(() => ({
  position: 'fixed' as const,
  top: '80px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 50,
}))

// ────────────────────────────────────────────
// Canvas ready → wire up listeners
// ────────────────────────────────────────────
watch(() => canvasStore.ready, async (ready) => {
  if (!ready) return
  const canvas = fabricCanvas.value
  if (!canvas) return

  toolbarSync.attachSelectionListeners(canvas)
  persistence.attachPersistenceListeners(canvas)

  // Load initial document if provided
  if (props.initialDocument) {
    await loadDocument(props.initialDocument)
  }

  // Wire change emit
  canvas.on('object:modified', emitChange)
  canvas.on('object:added', emitChange)
  canvas.on('object:removed', emitChange)
  // Re-apply viewport transform after text editing exits to guard against any state drift
  canvas.on('text:editing:exited', () => applyFabricZoom())

  await nextTick()
  fitToViewport()

  emit('ready')
})

// ────────────────────────────────────────────
// Document load / capture
// ────────────────────────────────────────────
async function loadDocument(doc: AvnacDocumentV1) {
  const canvas = fabricCanvas.value
  const mod = fabricMod.value
  if (!canvas || !mod) return

  canvas.clear()
  canvasStore.bgValue = doc.bg

  // canvas.clear() resets backgroundColor to '' — re-apply from doc
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

  artboardWRef.value = doc.artboard.width
  artboardHRef.value = doc.artboard.height
  // Resize canvas to display resolution immediately (watch fires async, do it sync too)
  applyFabricZoom()

  const fabricData = doc.fabric as { objects?: unknown[] }
  if (fabricData.objects?.length) {
    const objects = await mod.util.enlivenObjects(fabricData.objects)
    objects.forEach((o) => canvas.add(o as import('fabric').FabricObject))
  }

  canvas.requestRenderAll()
}

function getDocument(): AvnacDocumentV1 {
  return captureAvnacDocument(fabricCanvas.value!, {
    w: artboardWRef.value,
    h: artboardHRef.value,
    bgValue: canvasStore.bgValue,
  })
}

function emitChange() {
  const canvas = fabricCanvas.value
  if (!canvas) return
  emit('change', getDocument())
}

// ────────────────────────────────────────────
// Fit to viewport
// ────────────────────────────────────────────
function fitToViewport() {
  const viewport = viewportRef.value
  if (!viewport) return
  const vw = viewport.clientWidth - 80
  const vh = viewport.clientHeight - 120
  const scaleX = vw / artboardWRef.value
  const scaleY = vh / artboardHRef.value
  const scale = Math.min(scaleX, scaleY, 1)
  canvasStore.zoomPercent = Math.round(scale * 100)
  // Always apply even if zoomPercent didn't change (watch only fires on value change)
  applyFabricZoom()
}

function setZoom(pct: number) {
  canvasStore.zoomPercent = Math.max(10, Math.min(400, pct))
  applyFabricZoom()
}

// ────────────────────────────────────────────
// Keyboard shortcuts
// ────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (target.closest('input, textarea, [contenteditable="true"]')) return
  if (target.closest('[data-avnac-chrome]')) return

  const canvas = fabricCanvas.value
  const mod = fabricMod.value
  if (!canvas || !mod) return

  // Undo / redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault()
    if (e.shiftKey) { redo(); return }
    undo()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault()
    redo()
    return
  }

  // Select all
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault()
    canvas.setActiveObject(new mod.ActiveSelection(canvas.getObjects(), { canvas }))
    canvas.requestRenderAll()
    return
  }

  const active = canvas.getActiveObject()
  if (!active) return

  // Delete / backspace
  if (e.key === 'Backspace' || e.key === 'Delete') {
    if ('isEditing' in active && (active as import('fabric').IText).isEditing) return
    e.preventDefault()
    removeActiveObjectFromCanvas(canvas)
    canvas.requestRenderAll()
    canvasStore.clearSelection()
    return
  }

  // Arrow nudge
  const dirX = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
  const dirY = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0
  if (dirX === 0 && dirY === 0) return
  if ('isEditing' in active && (active as import('fabric').IText).isEditing) return
  e.preventDefault()
  const step = e.shiftKey ? 10 : 1
  const dx = dirX * step
  const dy = dirY * step
  if (mod.ActiveSelection && active instanceof mod.ActiveSelection) {
    active.getObjects().forEach((o) => {
      if (getAvnacLocked(o)) return
      o.set({ left: (o.left ?? 0) + dx, top: (o.top ?? 0) + dy })
      o.setCoords()
    })
    active.setCoords()
  } else {
    if (getAvnacLocked(active)) return
    active.set({ left: (active.left ?? 0) + dx, top: (active.top ?? 0) + dy })
    active.setCoords()
  }
  canvas.requestRenderAll()
  schedulePersist(canvas)
}

function onBackgroundClick() {
  fabricCanvas.value?.discardActiveObject()
  fabricCanvas.value?.requestRenderAll()
  canvasStore.clearSelection()
}

// ────────────────────────────────────────────
// Public API (defineExpose)
// ────────────────────────────────────────────
defineExpose({
  getDocument,
  setDocument: loadDocument,
  exportPng: (opts?: { multiplier?: number; transparent?: boolean }) => {
    const canvas = fabricCanvas.value
    if (!canvas) return
    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: opts?.multiplier ?? 1,
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'export.png'
    a.click()
  },
  undo,
  redo,
  setZoom,
  fitToViewport,
  shapeTools,
  layerPanel,
  fabricCanvas,
})
</script>

<style scoped>
.avnac-editor {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-base, #f5f5f5);
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.avnac-canvas-zoom {
  position: relative;
  flex-shrink: 0;
}

.avnac-artboard-frame {
  position: absolute;
  top: 0;
  left: 0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.avnac-element-toolbar {
  pointer-events: auto;
}

.avnac-sidebar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 40;
  pointer-events: auto;
}

.avnac-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  pointer-events: auto;
}
</style>
