<template>
  <div ref="viewportRef" class="avnac-editor" tabindex="0" @pointerdown.capture="refreshCanvasOffset" @contextmenu.prevent>
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
import { ref, computed, watch, nextTick, shallowRef, onBeforeUnmount } from 'vue'
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
import { getSceneHandleSizesForArtboard, applySceneHandleSizesToCanvas, applySceneHandleSizesToInteractiveObject } from '#/lib/fabric-selection-chrome'
import { refreshAvnacLineArrowHandleSizes } from '#/lib/fabric-line-arrow-controls'
import { getAvnacGroupId } from '#/lib/avnac-shape-meta'
import { findGroupMembers } from '#/lib/avnac-logical-group'
import { getAvnacShapeMeta, isAvnacStrokeLineLike } from '#/lib/avnac-shape-meta'
import { installArrowEndpointControls } from '#/lib/fabric-line-arrow-controls'
import { applyTextFormatChange } from '#/lib/apply-text-format'
import {
  createAvnacCommandRegistry,
  type AvnacEditorContext,
  type AvnacEditorPlugin,
} from '#/lib/avnac-plugin'

// ────────────────────────────────────────────
// Props / emits
// ────────────────────────────────────────────
const props = withDefaults(defineProps<{
  initialDocument?: AvnacDocumentV1
  persistId?: string
  persistDisplayName?: string
  artboardWidth?: number
  artboardHeight?: number
  plugins?: AvnacEditorPlugin[]
}>(), {
  artboardWidth: 4000,
  artboardHeight: 4000,
  plugins: () => [],
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
const pluginContext = shallowRef<AvnacEditorContext | null>(null)
const commands = createAvnacCommandRegistry()
let pluginCleanups: Array<() => void> = []

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
  const mod = fabricMod.value
  const scale = zoomPercent.value / 100
  const w = Math.round(artboardWRef.value * scale)
  const h = Math.round(artboardHRef.value * scale)
  canvas.setDimensions({ width: w, height: h })
  canvas.setViewportTransform([scale, 0, 0, scale, 0, 0])
  canvas.calcOffset()
  if (mod) {
    // Re-compute handle sizes so corners/rotate handles stay ~11px on screen
    // regardless of zoom level (handles are in artboard/scene coordinates).
    const sizes = getSceneHandleSizesForArtboard(
      Math.min(artboardWRef.value, artboardHRef.value),
      zoomPercent.value,
    )
    applySceneHandleSizesToCanvas(canvas, mod, sizes)
    refreshAvnacLineArrowHandleSizes(canvas, mod, sizes)
  } else {
    canvas.requestRenderAll()
  }
}

function refreshCanvasOffset() {
  fabricCanvas.value?.calcOffset()
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
  window.addEventListener('keydown', onKeyDown, true)

  toolbarSync.attachSelectionListeners(canvas)
  persistence.attachPersistenceListeners(canvas)
  installPlugins(canvas, fabricMod.value!)

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

  // Re-apply zoom-correct handle sizes to each newly added object.
  // customizeControlMap bakes hardcoded sizeX/sizeY into Control instances at object
  // creation time; objects added after applyFabricZoom runs need this post-add fixup.
  canvas.on('object:added', (evt: any) => {
    const m = fabricMod.value
    if (!m) return
    const obj = evt.target
    if (!(obj instanceof m.InteractiveFabricObject)) return
    const sizes = getSceneHandleSizesForArtboard(
      Math.min(artboardWRef.value, artboardHRef.value),
      zoomPercent.value,
    )
    applySceneHandleSizesToInteractiveObject(obj, sizes)
    refreshAvnacLineArrowHandleSizes(canvas, m, sizes)
  })

  // Flat logical-group selection: when a member of a logical group is clicked,
  // promote the selection to an ActiveSelection of all group siblings.
  canvas.on('selection:created', () => {
    const mod = fabricMod.value
    if (!mod) return
    const active = canvas.getActiveObject() as any
    if (!active) return
    // Skip if already an ActiveSelection (could be user-drawn marquee)
    if (active instanceof mod.ActiveSelection) return

    if (isSmartObjectChild(active)) return

    const groupId = getAvnacGroupId(active)
    if (!groupId) return

    // Don't auto-expand when the user has drilled into a specific child
    if ((canvas as any).__avnacDrilledGroupId === groupId) return

    const members = findGroupMembers(canvas, groupId)
    if (members.length <= 1) return

    const sel = new mod.ActiveSelection(members, { canvas: canvas as any })
    canvas.setActiveObject(sel as any)
    canvas.requestRenderAll()
  })

  canvas.on('selection:updated', () => {
    const mod = fabricMod.value
    if (!mod) return
    const active = canvas.getActiveObject() as any
    if (!active) return
    if (active instanceof mod.ActiveSelection) return

    if (isSmartObjectChild(active)) return

    const groupId = getAvnacGroupId(active)
    if (!groupId) return
    if ((canvas as any).__avnacDrilledGroupId === groupId) return

    const members = findGroupMembers(canvas, groupId)
    if (members.length <= 1) return

    const sel = new mod.ActiveSelection(members, { canvas: canvas as any })
    canvas.setActiveObject(sel as any)
    canvas.requestRenderAll()
  })

  // Clear drill-in state when selection cleared (background click or Escape)
  canvas.on('selection:cleared', () => {
    ;(canvas as any).__avnacDrilledGroupId = null
  })

  // Double-click on a flat-group textbox: drill in and enter editing directly.
  // Flat group members are top-level canvas objects, so no phantom/coord transform needed.
  canvas.on('mouse:dblclick', (opt: any) => {
    const target = opt.target as any
    if (!target) return

    if (isSmartObjectChild(target)) return

    const groupId = getAvnacGroupId(target)
    if (groupId && (target.type === 'textbox' || target.type === 'i-text')) {
      // Drill into this child: clear group selection, set single object active
      ;(canvas as any).__avnacDrilledGroupId = groupId
      canvas.discardActiveObject()
      canvas.setActiveObject(target)
      if (target.enterEditing) target.enterEditing()
      canvas.requestRenderAll()
      return
    }

    // Legacy: double-click on a Fabric Group (non-flat composites, e.g. arrow groups)
    if (!target || target.type !== 'group') return
    const subs: any[] = (canvas as any).targets ?? []
    const tb = subs.find((s: any) => s.type === 'textbox' || s.type === 'i-text')
    if (!tb || !tb.enterEditing) return
    const mod = fabricMod.value
    if (!mod) return

    const phantom = new mod.Textbox(tb.text as string, {
      left:         (tb.left         ?? 0)       as number,
      top:          (tb.top          ?? 0)       as number,
      width:        (tb.width        ?? 200)     as number,
      fontSize:     tb.fontSize                  as number,
      fontFamily:   (tb.fontFamily   ?? 'Inter') as string,
      fontWeight:   (tb.fontWeight   ?? 'normal') as string,
      fontStyle:    (tb.fontStyle    ?? 'normal') as string,
      textAlign:    (tb.textAlign    ?? 'left')   as string,
      fill:         (tb.fill         ?? '#262626') as string,
      scaleX:       (tb.scaleX       ?? 1)        as number,
      scaleY:       (tb.scaleY       ?? 1)        as number,
      angle:        (tb.angle        ?? 0)        as number,
      lineHeight:   (tb.lineHeight   ?? 1.16)     as number,
      charSpacing:  (tb.charSpacing  ?? 0)        as number,
      underline:    (tb.underline    ?? false)     as boolean,
      padding: 0,
    })

    const sop = (mod.util as any).sendObjectToPlane
    if (sop) sop(phantom, target.calcTransformMatrix(), undefined)

    tb.visible = false
    target.dirty = true

    suppressChangeEmit = true
    canvas.add(phantom)
    suppressChangeEmit = false

    canvas.setActiveObject(phantom)
    phantom.enterEditing()
    canvas.requestRenderAll()

    phantom.once('editing:exited', () => {
      tb.set({ text: phantom.text })
      tb.visible = true
      target.dirty = true
      suppressChangeEmit = true
      canvas.remove(phantom)
      suppressChangeEmit = false
      canvas.discardActiveObject()
      canvas.setActiveObject(target)
      canvas.requestRenderAll()
      emitChange()
    })
  })

  await nextTick()
  fitToViewport()

  emit('ready')
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown, true)
  for (const cleanup of pluginCleanups) cleanup()
  pluginCleanups = []
  pluginContext.value = null
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
    objects.forEach((o) => {
      restoreObjectControls(o as import('fabric').FabricObject)
      canvas.add(o as import('fabric').FabricObject)
    })
  }

  canvas.requestRenderAll()
  canvas.calcOffset()
}

function restoreObjectControls(obj: import('fabric').FabricObject) {
  const mod = fabricMod.value
  if (!mod) return
  const meta = getAvnacShapeMeta(obj)
  if (meta && isAvnacStrokeLineLike(meta) && obj instanceof mod.Group) {
    installArrowEndpointControls(obj)
  }
}

function getDocument(): AvnacDocumentV1 {
  return captureAvnacDocument(fabricCanvas.value!, {
    w: artboardWRef.value,
    h: artboardHRef.value,
    bgValue: canvasStore.bgValue,
  })
}

// Suppressed while a phantom editing-overlay textbox is live on the canvas
// so the phantom doesn't pollute the persisted document.
let suppressChangeEmit = false

function emitChange() {
  if (suppressChangeEmit) return
  const canvas = fabricCanvas.value
  if (!canvas) return
  emit('change', getDocument())
}

function isSmartObjectChild(obj: unknown): boolean {
  return !!obj && typeof obj === 'object' && typeof (obj as { avnacSmartObjectId?: unknown }).avnacSmartObjectId === 'string'
}

function installPlugins(canvas: import('fabric').Canvas, mod: typeof import('fabric')) {
  for (const cleanup of pluginCleanups) cleanup()
  pluginCleanups = []

  const ctx: AvnacEditorContext = {
    canvas,
    fabric: mod,
    commands,
    getArtboard: () => ({
      width: artboardWRef.value,
      height: artboardHRef.value,
    }),
    requestPersist: () => schedulePersist(canvas),
    notifyChange: emitChange,
  }

  pluginContext.value = ctx

  for (const plugin of props.plugins) {
    const cleanup = plugin.install(ctx)
    if (cleanup) pluginCleanups.push(cleanup)
  }
}

// ────────────────────────────────────────────
// Fit to viewport
// ────────────────────────────────────────────
function fitToViewport() {
  const viewport = viewportRef.value
  if (!viewport) return
  const vw = viewport.clientWidth - 96
  const vh = viewport.clientHeight - 180
  const scaleX = vw / artboardWRef.value
  const scaleY = vh / artboardHRef.value
  const scale = Math.min(scaleX, scaleY, 1)
  canvasStore.zoomPercent = Math.round(scale * 100)
  // Always apply even if zoomPercent didn't change (watch only fires on value change)
  applyFabricZoom()
  fabricCanvas.value?.calcOffset()
}

function setZoom(pct: number) {
  canvasStore.zoomPercent = Math.max(10, Math.min(400, pct))
  applyFabricZoom()
}

// ────────────────────────────────────────────
// Keyboard shortcuts
// ────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  const canvas = fabricCanvas.value
  const mod = fabricMod.value
  if (!canvas || !mod) return
  const active = canvas.getActiveObject()
  const activeText = active && (active instanceof mod.IText || active instanceof mod.Textbox) ? active : null

  if ((e.ctrlKey || e.metaKey) && activeText) {
    const key = e.key.toLowerCase()
    if (key === 'b' || key === 'i' || key === 'u') {
      e.preventDefault()
      const partial =
        key === 'b'
          ? { bold: !(activeText.fontWeight === 'bold' || activeText.fontWeight === 700) }
          : key === 'i'
            ? { italic: activeText.fontStyle !== 'italic' }
            : { underline: !activeText.underline }
      void applyTextFormatChange(mod, canvas, activeText, partial)
      return
    }
    if (key === '+' || key === '=' || key === '-' || key === '_') {
      e.preventDefault()
      const current = activeText.fontSize ?? Math.round(artboardWRef.value * 0.04)
      const delta = (key === '-' || key === '_') ? -4 : 4
      void applyTextFormatChange(mod, canvas, activeText, { fontSize: Math.max(8, Math.round(current + delta)) })
      return
    }
  }

  const target = e.target as HTMLElement
  if (target.closest('input, textarea, [contenteditable="true"]')) return
  if (target.closest('[data-avnac-chrome]')) return

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
  commands,
  runCommand: commands.run,
  pluginContext,
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
