import type { ShallowRef } from 'vue'
import type { Canvas } from 'fabric'
import { bgValueSolidFallback, applyBgValueToFill } from '#/lib/avnac-fill-paint'
import { setAvnacShapeMeta } from '#/lib/avnac-shape-meta'
import { ensureAvnacLayerId } from '#/lib/ensure-avnac-layer-id'
import { regularPolygonPoints, starPolygonPoints } from '#/lib/avnac-shape-geometry'
import { createArrowGroup } from '#/lib/avnac-stroke-arrow'
import { installArrowEndpointControls } from '#/lib/fabric-line-arrow-controls'
import { enableTextboxAutoWidth, fitTextboxWidthToContent } from '#/lib/avnac-textbox-autowidth'
import { ensureGoogleFontFamilyReady } from '#/lib/load-google-font'
import { setAvnacStroke } from '#/lib/avnac-fill-paint'
import { useCanvasStore } from '#/stores/canvas'

type GesturePoint = { x: number; y: number }
type LineGestureKind = 'line' | 'curved-line' | 'arrow' | 'connector'

export function useShapeTools(
  fabricCanvas: ShallowRef<Canvas | null>,
  fabricMod: ShallowRef<typeof import('fabric') | null>,
  artboardWRef: { value: number },
  artboardHRef: { value: number },
) {
  const canvasStore = useCanvasStore()
  let cleanupLineDrawMode: (() => void) | null = null

  function layout() {
    const w = artboardWRef.value
    const h = artboardHRef.value
    return {
      fontSize: Math.round(w * 0.04),
      rectW: Math.round(w * 0.2),
      rectH: Math.round(h * 0.12),
    }
  }

  async function addText() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const { fontSize } = layout()
    const w = artboardWRef.value
    const h = artboardHRef.value
    const paint = canvasStore.selectedPaint
    // Await font ready so text renders with correct metrics from the first paint
    // (prevents FOUT and cursor-position misalignment on initial render).
    await ensureGoogleFontFamilyReady('Inter')
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

  function connectorPathD(x1: number, y1: number, x2: number, y2: number): string {
    const midX = Math.round((x1 + x2) / 2)
    return `M ${Math.round(x1)} ${Math.round(y1)} L ${midX} ${Math.round(y1)} L ${midX} ${Math.round(y2)} L ${Math.round(x2)} ${Math.round(y2)}`
  }

  function addConnector() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const { rectW } = layout()
    const w = artboardWRef.value
    const h = artboardHRef.value
    const half = Math.round(rectW * 0.42)
    createConnectorFromEndpoints(w / 2 - half, h / 2 - 90, w / 2 + half, h / 2 + 90)
  }

  function addCurvedLine() {
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
    const curveBulge = -Math.round(Math.max(160, rectW * 0.18))
    const g = createArrowGroup(mod, x1, y1, x2, y2, {
      strokeWidth: strokeW,
      headFrac: 0,
      color: bgValueSolidFallback(paint),
      pathType: 'curved',
      curveBulge,
      roundedEnds: true,
    })
    setAvnacStroke(g, paint)
    setAvnacShapeMeta(g, {
      kind: 'line',
      arrowHead: 0,
      arrowEndpoints: { x1, y1, x2, y2 },
      arrowStrokeWidth: strokeW,
      arrowLineStyle: 'solid',
      arrowRoundedEnds: true,
      arrowPathType: 'curved',
      arrowCurveBulge: curveBulge,
      arrowCurveT: 0.5,
    })
    installArrowEndpointControls(g)
    ensureAvnacLayerId(g)
    canvas.add(g)
    canvas.setActiveObject(g)
    canvas.requestRenderAll()
  }

  function createConnectorFromEndpoints(x1: number, y1: number, x2: number, y2: number) {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    const paint = canvasStore.selectedPaint
    const path = new mod.Path(connectorPathD(x1, y1, x2, y2), {
      fill: '',
      stroke: bgValueSolidFallback(paint),
      strokeWidth: 6,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      objectCaching: false,
    })
    setAvnacStroke(path, paint)
    setAvnacShapeMeta(path, {
      kind: 'connector',
      arrowEndpoints: { x1, y1, x2, y2 },
      arrowStrokeWidth: 6,
      arrowLineStyle: 'solid',
      arrowRoundedEnds: true,
    })
    ensureAvnacLayerId(path)
    canvas.add(path)
    canvas.setActiveObject(path)
    canvas.requestRenderAll()
  }

  function pointFromEvent(canvas: Canvas, event: unknown): GesturePoint {
    const withScenePoint = canvas as Canvas & { getScenePoint?: (e: unknown) => GesturePoint }
    if (withScenePoint.getScenePoint) return withScenePoint.getScenePoint(event)
    return (canvas as Canvas & { getPointer: (e: unknown) => GesturePoint }).getPointer(event)
  }

  function pathLength(points: GesturePoint[]): number {
    let len = 0
    for (let i = 1; i < points.length; i++) {
      len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    }
    return len
  }

  function curveBulgeFromPoints(points: GesturePoint[]): number {
    const first = points[0]
    const last = points[points.length - 1]
    const dx = last.x - first.x
    const dy = last.y - first.y
    const len = Math.max(1, Math.hypot(dx, dy))
    const nx = -dy / len
    const ny = dx / len
    let strongest = 0
    for (const point of points) {
      const signed = (point.x - first.x) * nx + (point.y - first.y) * ny
      if (Math.abs(signed) > Math.abs(strongest)) strongest = signed
    }
    return strongest * 2
  }

  function createFreehandPath(points: GesturePoint[], kind: LineGestureKind) {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod || points.length < 2) return
    const paint = canvasStore.selectedPaint
    const color = bgValueSolidFallback(paint)
    const d = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${Math.round(point.x * 10) / 10} ${Math.round(point.y * 10) / 10}`)
      .join(' ')
    const path = new mod.Path(d, {
      fill: '',
      stroke: color,
      strokeWidth: 5,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      objectCaching: false,
    })
    setAvnacStroke(path, paint)
    setAvnacShapeMeta(path, {
      kind: kind === 'curved-line' ? 'line' : kind,
      arrowStrokeWidth: 5,
      arrowLineStyle: 'solid',
      arrowRoundedEnds: true,
      arrowPathType: 'curved',
    })
    ensureAvnacLayerId(path)
    canvas.add(path)
    canvas.setActiveObject(path)
    canvas.requestRenderAll()
  }

  function createLineFromGesture(points: GesturePoint[], kind: LineGestureKind) {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod || points.length < 2) return
    const first = points[0]
    const last = points[points.length - 1]
    const direct = Math.hypot(last.x - first.x, last.y - first.y)
    if (direct < 6) {
      kind === 'arrow' ? addArrow() : kind === 'connector' ? addConnector() : addLine()
      return
    }

    if (kind === 'connector') {
      createConnectorFromEndpoints(first.x, first.y, last.x, last.y)
      return
    }

    const drawn = pathLength(points)
    const ratio = drawn / Math.max(1, direct)
    if (ratio > 1.65 && points.length > 8) {
      createFreehandPath(points, kind)
      return
    }

    const paint = canvasStore.selectedPaint
    const color = bgValueSolidFallback(paint)
    const strokeW = 6
    const curveBulge = curveBulgeFromPoints(points)
    const forceCurved = kind === 'curved-line'
    const isCurved = forceCurved || Math.abs(curveBulge) > Math.max(20, direct * 0.08) || ratio > 1.12
    const effectiveBulge = forceCurved && Math.abs(curveBulge) < Math.max(20, direct * 0.08)
      ? -Math.min(direct * 0.3, 220)
      : curveBulge
    const head = kind === 'arrow' ? 1 : 0
    const g = createArrowGroup(mod, first.x, first.y, last.x, last.y, {
      strokeWidth: strokeW,
      headFrac: head,
      color,
      pathType: isCurved ? 'curved' : 'straight',
      curveBulge: isCurved ? effectiveBulge : undefined,
      roundedEnds: kind === 'line' || kind === 'curved-line',
    })
    setAvnacStroke(g, paint)
    setAvnacShapeMeta(g, {
      kind: kind === 'curved-line' ? 'line' : kind,
      arrowHead: head,
      arrowEndpoints: { x1: first.x, y1: first.y, x2: last.x, y2: last.y },
      arrowStrokeWidth: strokeW,
      arrowLineStyle: 'solid',
      arrowRoundedEnds: kind === 'line' || kind === 'curved-line',
      arrowPathType: isCurved ? 'curved' : 'straight',
      arrowCurveBulge: isCurved ? effectiveBulge : undefined,
      arrowCurveT: 0.5,
    })
    installArrowEndpointControls(g)
    ensureAvnacLayerId(g)
    canvas.add(g)
    canvas.setActiveObject(g)
    canvas.requestRenderAll()
  }

  function startLineDrawMode(kind: LineGestureKind) {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    cleanupLineDrawMode?.()

    let drawing = false
    let points: GesturePoint[] = []
    let preview: import('fabric').FabricObject | null = null
    const priorSelection = canvas.selection
    const priorCursor = canvas.defaultCursor
    canvas.selection = false
    canvas.defaultCursor = 'crosshair'
    canvas.discardActiveObject()
    canvas.requestRenderAll()

    const finish = (commit: boolean) => {
      canvas.off('mouse:down', onMouseDown)
      canvas.off('mouse:move', onMouseMove)
      canvas.off('mouse:up', onMouseUp)
      window.removeEventListener('keydown', onKeyDown)
      cleanupLineDrawMode = null
      canvas.selection = priorSelection
      canvas.defaultCursor = priorCursor
      if (preview) {
        canvas.remove(preview)
        preview = null
      }
      if (commit) createLineFromGesture(points, kind)
      else canvas.requestRenderAll()
    }

    const onMouseDown = (eventInfo: any) => {
      drawing = true
      points = [pointFromEvent(canvas, eventInfo.e)]
      preview = kind === 'connector'
        ? new mod.Path(connectorPathD(points[0].x, points[0].y, points[0].x, points[0].y), {
          fill: '',
          stroke: bgValueSolidFallback(canvasStore.selectedPaint),
          strokeWidth: 3,
          strokeDashArray: [8, 5],
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          selectable: false,
          evented: false,
        })
        : new mod.Line([points[0].x, points[0].y, points[0].x, points[0].y], {
        stroke: bgValueSolidFallback(canvasStore.selectedPaint),
        strokeWidth: 3,
        strokeDashArray: [8, 5],
        selectable: false,
        evented: false,
      })
      canvas.add(preview)
      canvas.requestRenderAll()
    }

    const onMouseMove = (eventInfo: any) => {
      if (!drawing || !preview) return
      const point = pointFromEvent(canvas, eventInfo.e)
      const last = points[points.length - 1]
      if (!last || Math.hypot(point.x - last.x, point.y - last.y) >= 3) points.push(point)
      if (kind === 'connector') {
        canvas.remove(preview)
        preview = new mod.Path(connectorPathD(points[0].x, points[0].y, point.x, point.y), {
          fill: '',
          stroke: bgValueSolidFallback(canvasStore.selectedPaint),
          strokeWidth: 3,
          strokeDashArray: [8, 5],
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          selectable: false,
          evented: false,
        })
        canvas.add(preview)
      } else {
        preview.set({ x2: point.x, y2: point.y } as any)
      }
      preview.setCoords()
      canvas.requestRenderAll()
    }

    const onMouseUp = (eventInfo: any) => {
      if (!drawing) return
      drawing = false
      points.push(pointFromEvent(canvas, eventInfo.e))
      finish(true)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      finish(false)
    }

    cleanupLineDrawMode = () => finish(false)
    canvas.on('mouse:down', onMouseDown)
    canvas.on('mouse:move', onMouseMove)
    canvas.on('mouse:up', onMouseUp)
    window.addEventListener('keydown', onKeyDown)
  }

  function startPenDrawMode() {
    const canvas = fabricCanvas.value
    const mod = fabricMod.value
    if (!canvas || !mod) return
    cleanupLineDrawMode?.()

    let drawing = false
    let points: GesturePoint[] = []
    let preview: import('fabric').Path | null = null
    const priorSelection = canvas.selection
    const priorCursor = canvas.defaultCursor
    canvas.selection = false
    canvas.defaultCursor = 'crosshair'
    canvas.discardActiveObject()
    canvas.requestRenderAll()

    const previewPathD = () => points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${Math.round(point.x * 10) / 10} ${Math.round(point.y * 10) / 10}`)
      .join(' ')

    const updatePreview = () => {
      if (preview) {
        canvas.remove(preview)
        preview = null
      }
      if (points.length < 2) return
      preview = new mod.Path(previewPathD(), {
        fill: '',
        stroke: bgValueSolidFallback(canvasStore.selectedPaint),
        strokeWidth: 5,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        selectable: false,
        evented: false,
        objectCaching: false,
        excludeFromExport: true,
        opacity: 0.92,
      } as any)
      canvas.add(preview)
      canvas.requestRenderAll()
    }

    const finish = (commit: boolean) => {
      canvas.off('mouse:down', onMouseDown)
      canvas.off('mouse:move', onMouseMove)
      canvas.off('mouse:up', onMouseUp)
      window.removeEventListener('keydown', onKeyDown)
      cleanupLineDrawMode = null
      canvas.selection = priorSelection
      canvas.defaultCursor = priorCursor
      if (preview) {
        canvas.remove(preview)
        preview = null
      }
      if (commit && points.length >= 2) createFreehandPath(points, 'line')
      else canvas.requestRenderAll()
    }

    const onMouseDown = (eventInfo: any) => {
      drawing = true
      points = [pointFromEvent(canvas, eventInfo.e)]
    }

    const onMouseMove = (eventInfo: any) => {
      if (!drawing) return
      const point = pointFromEvent(canvas, eventInfo.e)
      const last = points[points.length - 1]
      if (!last || Math.hypot(point.x - last.x, point.y - last.y) >= 2) {
        points.push(point)
        updatePreview()
      }
    }

    const onMouseUp = (eventInfo: any) => {
      if (!drawing) return
      drawing = false
      points.push(pointFromEvent(canvas, eventInfo.e))
      finish(true)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      finish(false)
    }

    cleanupLineDrawMode = () => finish(false)
    canvas.on('mouse:down', onMouseDown)
    canvas.on('mouse:move', onMouseMove)
    canvas.on('mouse:up', onMouseUp)
    window.addEventListener('keydown', onKeyDown)
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
      case 'curved-line': return addCurvedLine()
      case 'connector': return addConnector()
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
    addCurvedLine,
    addArrow,
    startLineDrawMode,
    startPenDrawMode,
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
