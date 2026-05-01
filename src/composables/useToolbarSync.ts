import type { ShallowRef } from 'vue'
import type { Canvas, IText } from 'fabric'
import { getAvnacShapeMeta, getAvnacGroupKind, isAvnacStrokeLineLike } from '#/lib/avnac-shape-meta'
import type { AvnacAnimationEntry } from '#/lib/avnac-animation'
import {
  bgValueFromFabricFill,
  bgValueFromFabricStroke,
  getAvnacStroke,
} from '#/lib/avnac-fill-paint'
import { arrowDisplayColor } from '#/lib/avnac-stroke-arrow'
import { readBlurPctFromFabricObject } from '#/lib/avnac-object-blur'
import { readFabricShadowUi } from '#/lib/avnac-fabric-shadow'
import { sceneCornerRadiusFromRect, sceneCornerRadiusMaxForObject } from '#/lib/fabric-corner-radius'
import { syncAvnacArrowCurveControlVisibility } from '#/lib/fabric-line-arrow-controls'
import { useCanvasStore } from '#/stores/canvas'
import type { BgValue } from '#/lib/bg-value'

// Must match the TextFormatToolbarValues in the store
interface TextFormatReading {
  fontFamily: string
  fontSize: number
  fillStyle: BgValue
  textAlign: 'left' | 'center' | 'right' | 'justify'
  bold: boolean
  italic: boolean
  underline: boolean
  lineHeight: number
}

function readTextFormat(obj: IText, defaultFontSize: number): TextFormatReading {
  const fill = (typeof obj.fill === 'string' ? obj.fill : '#000000')
  return {
    fontFamily: obj.fontFamily ?? 'Inter',
    fontSize: obj.fontSize ?? defaultFontSize,
    fillStyle: { type: 'solid', color: fill },
    textAlign: (obj.textAlign as TextFormatReading['textAlign']) ?? 'left',
    bold: obj.fontWeight === 'bold' || obj.fontWeight === 700,
    italic: obj.fontStyle === 'italic',
    underline: obj.underline ?? false,
    lineHeight: obj.lineHeight ?? 1.2,
  }
}

export function useToolbarSync(
  fabricCanvas: ShallowRef<Canvas | null>,
  fabricMod: ShallowRef<typeof import('fabric') | null>,
  artboardWRef: { value: number },
) {
  const canvasStore = useCanvasStore()

  function syncTextToolbar() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) {
      canvasStore.textToolbarValues = null
      return
    }
    const targets = canvas.getActiveObjects()
    const obj = canvas.getActiveObject()
    if (targets.length !== 1 || !obj || !(obj instanceof mod.IText)) {
      canvasStore.textToolbarValues = null
      return
    }
    // Suppress legacy diagram/infographic child text, but allow smart-object
    // labels while the user is directly editing them.
    const groupKind = getAvnacGroupKind(obj)
    const isSmartObjectText = typeof (obj as IText & { avnacSmartObjectId?: unknown }).avnacSmartObjectId === 'string'
    if ((groupKind === 'diagram' || groupKind === 'infographic') && !isSmartObjectText) {
      canvasStore.textToolbarValues = null
      return
    }
    const defaultFontSize = Math.round(artboardWRef.value * 0.04)
    canvasStore.textToolbarValues = readTextFormat(obj as IText, defaultFontSize)
  }

  function syncShapeToolbar() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) {
      canvasStore.shapeToolbarModel = null
      return
    }
    const targets = canvas.getActiveObjects()
    const obj = canvas.getActiveObject()
    const meta = getAvnacShapeMeta(obj)
    const shapeBarKind =
      meta &&
      ['rect', 'ellipse', 'polygon', 'star', 'line', 'arrow'].includes(meta.kind)
    if (targets.length !== 1 || !obj || !shapeBarKind || !meta) {
      canvasStore.shapeToolbarModel = null
      return
    }
    let paint: BgValue
    if (meta.kind === 'line' && !(obj instanceof mod.Group)) {
      paint = bgValueFromFabricStroke(obj)
    } else if (isAvnacStrokeLineLike(meta) && obj instanceof mod.Group) {
      paint =
        getAvnacStroke(obj) ??
        ({ type: 'solid', color: arrowDisplayColor(obj) } satisfies BgValue)
    } else {
      paint = bgValueFromFabricFill(obj)
    }
    if (meta.kind === 'rect' && obj instanceof mod.Rect) {
      canvasStore.shapeToolbarModel = {
        meta: { ...meta },
        paint,
        rectCornerRadius: sceneCornerRadiusFromRect(obj),
        rectCornerRadiusMax: sceneCornerRadiusMaxForObject(obj),
      }
    } else {
      canvasStore.shapeToolbarModel = { meta: { ...meta }, paint }
    }
    if (isAvnacStrokeLineLike(meta) && obj instanceof mod.Group) {
      syncAvnacArrowCurveControlVisibility(obj)
    }
    obj.setCoords()
  }

  function syncImageCornerToolbar() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod?.FabricImage) {
      canvasStore.imageCornerToolbar = null
      return
    }
    const targets = canvas.getActiveObjects()
    const obj = canvas.getActiveObject()
    if (targets.length !== 1 || !obj || !(obj instanceof mod.FabricImage)) {
      canvasStore.imageCornerToolbar = null
      return
    }
    canvasStore.imageCornerToolbar = {
      radius: sceneCornerRadiusFromRect(obj as unknown as import('fabric').Rect),
      max: sceneCornerRadiusMaxForObject(obj),
    }
  }

  function syncSelectionBlur() {
    const canvas = fabricCanvas.value
    if (!canvas) { canvasStore.selectionBlurPct = 0; return }
    const active = canvas.getActiveObject()
    if (!active) { canvasStore.selectionBlurPct = 0; return }
    if ('multiSelectionStacking' in active) {
      const objs = canvas.getActiveObjects()
      if (!objs.length) { canvasStore.selectionBlurPct = 0; return }
      const sum = objs.reduce((acc, o) => acc + readBlurPctFromFabricObject(o), 0)
      canvasStore.selectionBlurPct = Math.round(sum / objs.length)
      return
    }
    canvasStore.selectionBlurPct = readBlurPctFromFabricObject(active)
  }

  function syncSelectionOpacity() {
    const canvas = fabricCanvas.value
    if (!canvas) { canvasStore.selectionOpacityPct = 100; return }
    const active = canvas.getActiveObject()
    if (!active) { canvasStore.selectionOpacityPct = 100; return }
    if ('multiSelectionStacking' in active) {
      const objs = canvas.getActiveObjects()
      if (!objs.length) { canvasStore.selectionOpacityPct = 100; return }
      const sum = objs.reduce((acc, o) => acc + (typeof o.opacity === 'number' ? o.opacity : 1), 0)
      canvasStore.selectionOpacityPct = Math.round((sum / objs.length) * 100)
      return
    }
    const op = typeof active.opacity === 'number' ? active.opacity : 1
    canvasStore.selectionOpacityPct = Math.round(op * 100)
  }

  function syncSelectionShadow() {
    const canvas = fabricCanvas.value
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (!active) { canvasStore.selectionShadowActive = false; return }
    const ui = readFabricShadowUi(active)
    if (ui) {
      canvasStore.selectionShadowUi = ui
      canvasStore.selectionShadowActive = true
    } else {
      canvasStore.selectionShadowActive = false
    }
  }

  function syncAnimationToolbar() {
    const canvas = fabricCanvas.value
    if (!canvas) { canvasStore.animationToolbarModel = null; return }
    const active = canvas.getActiveObject()
    if (!active) { canvasStore.animationToolbarModel = null; return }
    const targets = ('multiSelectionStacking' in active ? canvas.getActiveObjects() : [active])
      .filter((obj) => (obj as { avnacSmartObjectRole?: string }).avnacSmartObjectRole !== 'frame')
    if (!targets.length) { canvasStore.animationToolbarModel = null; return }
    const entries: AvnacAnimationEntry[] = (targets[0] as any).avnacAnimations ?? []
    canvasStore.animationToolbarModel = { entries: [...entries] }
  }

  function syncChartKind() {
    const canvas = fabricCanvas.value
    if (!canvas) return
    const targets = canvas.getActiveObjects()
    const obj = canvas.getActiveObject()
    if (targets.length !== 1 || !obj) return
    if (getAvnacGroupKind(obj) !== 'chart') return
    // syncShapeToolbar cleared shapeToolbarModel for chart objects (not in shapeBarKind list).
    // Set a synthetic model so CanvasElementToolbar shows "Edit data" button.
    canvasStore.shapeToolbarModel = {
      meta: { kind: 'chart' as any },
      paint: bgValueFromFabricFill(obj),
    }
  }

  function syncAll() {
    const canvas = fabricCanvas.value
    if (!canvas) {
      canvasStore.clearSelection()
      return
    }
    const objects = canvas.getActiveObjects()
    canvasStore.hasObjectSelected = objects.length > 0
    canvasStore.canvasBodySelected = objects.length === 0
    canvasStore.tickSelection()
    syncTextToolbar()
    syncShapeToolbar()
    syncChartKind()
    syncImageCornerToolbar()
    syncSelectionBlur()
    syncSelectionOpacity()
    syncSelectionShadow()
    syncAnimationToolbar()
  }

  function attachSelectionListeners(canvas: Canvas) {
    canvas.on('selection:created', syncAll)
    canvas.on('selection:updated', syncAll)
    canvas.on('selection:cleared', () => canvasStore.clearSelection())
    canvas.on('object:modified', syncAll)
    canvas.on('text:editing:entered', syncAll)
    canvas.on('text:selection:changed', syncAll)
    canvas.on('text:changed', syncAll)
    canvas.on('text:editing:exited', syncAll)
  }

  return {
    syncAll,
    syncTextToolbar,
    syncShapeToolbar,
    attachSelectionListeners,
  }
}
