import type { ShallowRef } from 'vue'
import type { Canvas } from 'fabric'
import { bgValueSolidFallback, applyBgValueToFill } from '#/lib/avnac-fill-paint'
import { setAvnacShapeMeta } from '#/lib/avnac-shape-meta'
import { ensureAvnacLayerId } from '#/lib/ensure-avnac-layer-id'
import { regularPolygonPoints, starPolygonPoints } from '#/lib/avnac-shape-geometry'
import { createArrowGroup } from '#/lib/avnac-stroke-arrow'
import { installArrowEndpointControls } from '#/lib/fabric-line-arrow-controls'
import { enableTextboxAutoWidth, fitTextboxWidthToContent } from '#/lib/avnac-textbox-autowidth'
import { loadGoogleFontFamily } from '#/lib/load-google-font'
import { setAvnacStroke } from '#/lib/avnac-fill-paint'
import { useCanvasStore } from '#/stores/canvas'

export function useShapeTools(
  fabricCanvas: ShallowRef<Canvas | null>,
  fabricMod: ShallowRef<typeof import('fabric') | null>,
  artboardWRef: { value: number },
  artboardHRef: { value: number },
) {
  const canvasStore = useCanvasStore()

  function layout() {
    const w = artboardWRef.value
    const h = artboardHRef.value
    return {
      fontSize: Math.round(w * 0.04),
      rectW: Math.round(w * 0.2),
      rectH: Math.round(h * 0.12),
    }
  }

  function addText() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const { fontSize } = layout()
    const w = artboardWRef.value
    const h = artboardHRef.value
    const paint = canvasStore.selectedPaint
    loadGoogleFontFamily('Inter')
    const t = new mod.Textbox('Your text', {
      left: w / 2,
      top: h / 2,
      originX: 'center',
      originY: 'center',
      width: 20,
      fontSize,
      fill: bgValueSolidFallback(paint),
      fontFamily: 'Inter',
    })
    t.setControlsVisibility({ mt: false, mb: false })
    enableTextboxAutoWidth(t)
    fitTextboxWidthToContent(t)
    applyBgValueToFill(mod, t, paint)
    ensureAvnacLayerId(t)
    canvas.add(t)
    canvas.setActiveObject(t)
    canvas.requestRenderAll()
  }

  function addRect() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const w = artboardWRef.value
    const h = artboardHRef.value
    const side = Math.round(Math.min(w, h) * 0.18)
    const paint = canvasStore.selectedPaint
    const r = new mod.Rect({
      left: w / 2 - side / 2,
      top: h / 2 - side / 2,
      width: side,
      height: side,
      fill: bgValueSolidFallback(paint),
      rx: 0,
      ry: 0,
    })
    setAvnacShapeMeta(r, { kind: 'rect' })
    applyBgValueToFill(mod, r, paint)
    ensureAvnacLayerId(r)
    canvas.add(r)
    canvas.setActiveObject(r)
    canvas.requestRenderAll()
  }

  function addEllipse() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const { rectW, rectH } = layout()
    const w = artboardWRef.value
    const h = artboardHRef.value
    const paint = canvasStore.selectedPaint
    const r = Math.round(Math.min(rectW, rectH) / 2)
    const e = new mod.Ellipse({
      left: w / 2,
      top: h / 2,
      rx: r,
      ry: r,
      fill: bgValueSolidFallback(paint),
      originX: 'center',
      originY: 'center',
    })
    setAvnacShapeMeta(e, { kind: 'ellipse' })
    applyBgValueToFill(mod, e, paint)
    ensureAvnacLayerId(e)
    canvas.add(e)
    canvas.setActiveObject(e)
    canvas.requestRenderAll()
  }

  function addPolygon(sides = 6) {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const { rectW } = layout()
    const w = artboardWRef.value
    const h = artboardHRef.value
    const paint = canvasStore.selectedPaint
    const R = Math.round(rectW * 0.36)
    const pts = regularPolygonPoints(sides, R)
    const p = new mod.Polygon(pts, {
      left: w / 2,
      top: h / 2,
      fill: bgValueSolidFallback(paint),
      originX: 'center',
      originY: 'center',
    })
    setAvnacShapeMeta(p, { kind: 'polygon', polygonSides: sides })
    applyBgValueToFill(mod, p, paint)
    ensureAvnacLayerId(p)
    canvas.add(p)
    canvas.setActiveObject(p)
    canvas.requestRenderAll()
  }

  function addStar(points = 5) {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const { rectW } = layout()
    const w = artboardWRef.value
    const h = artboardHRef.value
    const paint = canvasStore.selectedPaint
    const R = Math.round(rectW * 0.38)
    const pts = starPolygonPoints(points, R)
    const p = new mod.Polygon(pts, {
      left: w / 2,
      top: h / 2,
      fill: bgValueSolidFallback(paint),
      originX: 'center',
      originY: 'center',
    })
    setAvnacShapeMeta(p, { kind: 'star', starPoints: points })
    applyBgValueToFill(mod, p, paint)
    ensureAvnacLayerId(p)
    canvas.add(p)
    canvas.setActiveObject(p)
    canvas.requestRenderAll()
  }

  function addLine() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const { rectW } = layout()
    const w = artboardWRef.value
    const h = artboardHRef.value
    const paint = canvasStore.selectedPaint
    const half = Math.round(rectW * 0.42)
    const cx = w / 2
    const cy = h / 2
    const x1 = cx - half
    const y1 = cy
    const x2 = cx + half
    const y2 = cy
    const strokeW = 10
    const g = createArrowGroup(mod, x1, y1, x2, y2, {
      strokeWidth: strokeW,
      headFrac: 0,
      color: bgValueSolidFallback(paint),
    })
    setAvnacStroke(g, paint)
    setAvnacShapeMeta(g, {
      kind: 'line',
      arrowHead: 0,
      arrowEndpoints: { x1, y1, x2, y2 },
      arrowStrokeWidth: strokeW,
      arrowLineStyle: 'solid',
      arrowRoundedEnds: false,
      arrowPathType: 'straight',
    })
    installArrowEndpointControls(g)
    ensureAvnacLayerId(g)
    canvas.add(g)
    canvas.setActiveObject(g)
    canvas.requestRenderAll()
  }

  function addArrow() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const { rectW } = layout()
    const w = artboardWRef.value
    const h = artboardHRef.value
    const paint = canvasStore.selectedPaint
    const head = 1
    const cx = w / 2
    const cy = h / 2
    const half = Math.round(rectW * 0.42)
    const x1 = cx - half
    const y1 = cy
    const x2 = cx + half
    const y2 = cy
    const strokeW = 10
    const g = createArrowGroup(mod, x1, y1, x2, y2, {
      strokeWidth: strokeW,
      headFrac: head,
      color: bgValueSolidFallback(paint),
    })
    setAvnacStroke(g, paint)
    setAvnacShapeMeta(g, {
      kind: 'arrow',
      arrowHead: head,
      arrowEndpoints: { x1, y1, x2, y2 },
      arrowStrokeWidth: strokeW,
      arrowLineStyle: 'solid',
      arrowRoundedEnds: false,
      arrowPathType: 'straight',
    })
    installArrowEndpointControls(g)
    ensureAvnacLayerId(g)
    canvas.add(g)
    canvas.setActiveObject(g)
    canvas.requestRenderAll()
  }

  async function addImageFromFile(file: File) {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const w = artboardWRef.value
    const h = artboardHRef.value
    const dataUrl = await readFileAsDataUrl(file)
    const img = await mod.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })
    const maxW = w * 0.6
    const maxH = h * 0.6
    const scale = Math.min(maxW / (img.width ?? 1), maxH / (img.height ?? 1), 1)
    img.set({
      left: w / 2,
      top: h / 2,
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
    })
    ensureAvnacLayerId(img)
    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.requestRenderAll()
  }

  async function addImageFromUrl(opts: {
    url: string
    x?: number
    y?: number
    origin?: 'top-left' | 'center'
    width?: number
    height?: number
    rotation?: number
    opacity?: number
  }) {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return null
    const w = artboardWRef.value
    const h = artboardHRef.value
    const img = await mod.FabricImage.fromURL(opts.url, { crossOrigin: 'anonymous' })
    const targetW = opts.width ?? img.width ?? 200
    const targetH = opts.height ?? img.height ?? 200
    const scaleX = targetW / (img.width ?? 1)
    const scaleY = targetH / (img.height ?? 1)
    const originX = opts.origin === 'center' ? 'center' : 'left'
    const originY = opts.origin === 'center' ? 'center' : 'top'
    img.set({
      left: opts.x ?? w / 2,
      top: opts.y ?? h / 2,
      originX,
      originY,
      scaleX,
      scaleY,
      angle: opts.rotation ?? 0,
      opacity: opts.opacity ?? 1,
    })
    ensureAvnacLayerId(img)
    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.requestRenderAll()
    return img
  }

  function addShapeByKind(kind: string, opts?: { sides?: number; points?: number }) {
    switch (kind) {
      case 'rect': return addRect()
      case 'ellipse': return addEllipse()
      case 'polygon': return addPolygon(opts?.sides)
      case 'star': return addStar(opts?.points)
      case 'line': return addLine()
      case 'arrow': return addArrow()
    }
  }

  return {
    addText,
    addRect,
    addEllipse,
    addPolygon,
    addStar,
    addLine,
    addArrow,
    addImageFromFile,
    addImageFromUrl,
    addShapeByKind,
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
