import {
  Group,
  Circle,
  LayoutManager,
  LayoutStrategy,
  Path,
  Point,
  Polygon,
  classRegistry,
  type FabricObject,
  type XY,
} from 'fabric'
import type { ArrowHeadType, ArrowLineStyle, ArrowPathType } from './avnac-shape-meta'
import { getAvnacShapeMeta } from './avnac-shape-meta'

export type ArrowOpts = {
  strokeWidth: number
  headFrac: number
  color: string
  lineStyle?: ArrowLineStyle
  headType?: ArrowHeadType
  roundedEnds?: boolean
  pathType?: ArrowPathType
  curveBulge?: number
  /** Where on the shaft the Q control-point sits (0→tail, 1→tip). Default 0.5. */
  curveT?: number
}

/**
 * A layout strategy that never repositions children.
 * Arrow groups manage their own child placement.
 */
class ArrowNoop extends LayoutStrategy {
  static readonly type = 'arrow-noop'
  shouldPerformLayout() {
    return false
  }
}

export function registerAvnacStrokeArrowLayout() {
  classRegistry.setClass(ArrowNoop)
}

registerAvnacStrokeArrowLayout()

const arrowNoopLayout = new ArrowNoop()

function headGeometry(
  L: number,
  strokeW: number,
  headFrac: number,
): { headLen: number; headHalf: number } {
  const hf = Math.max(0, Math.min(2, headFrac))
  const shaftH = strokeW / 2
  const headWing = strokeW * 1.3 * hf
  const headHalf = shaftH + headWing
  const headLen = Math.min(headHalf * 1.6, L * 0.45)
  return { headLen, headHalf }
}

function dashArrayForStyle(
  style: ArrowLineStyle | undefined,
  strokeW: number,
): number[] | undefined {
  if (!style || style === 'solid') return undefined
  if (style === 'dashed') return [strokeW * 2.8, strokeW * 1.6]
  return [0, strokeW * 2.2]
}

function shaftStrokeLineCap(
  lineStyle: ArrowLineStyle | undefined,
  roundedEnds: boolean | undefined,
): CanvasLineCap {
  if (lineStyle === 'dotted') return 'round'
  return roundedEnds ? 'round' : 'butt'
}

function maxAbsCurveBulge(L: number, strokeW: number): number {
  return Math.max(L * 2, strokeW * 20, 400)
}

function curveBulgeAuto(L: number, strokeW: number): number {
  return -Math.min(L * 0.3, Math.max(strokeW * 5.5, 18))
}

export function clampArrowCurveBulge(
  L: number,
  strokeW: number,
  v: number,
): number {
  const cap = maxAbsCurveBulge(L, strokeW)
  return Math.min(cap, Math.max(-cap, v))
}

export function effectiveShaftBulge(
  L: number,
  strokeW: number,
  pathType: ArrowPathType | undefined,
  stored: number | undefined,
): number {
  if (pathType !== 'curved') return 0
  if (stored !== undefined && Number.isFinite(stored)) {
    return clampArrowCurveBulge(L, strokeW, stored)
  }
  return clampArrowCurveBulge(L, strokeW, curveBulgeAuto(L, strokeW))
}

export function arrowShaftLen(
  L: number,
  strokeW: number,
  headFrac: number,
): number {
  const hf = Math.max(0, Math.min(2, headFrac))
  const { headLen } = headGeometry(L, strokeW, headFrac)
  return hf < 0.01 ? L : Math.max(L - headLen, 1)
}

export function clampCurveT(v: number): number {
  return Math.min(0.95, Math.max(0.05, v))
}

/**
 * Group-local position of the on-curve point at bezier parameter s=0.5.
 * For Q(P0, P1, P2) with P1.x = x0 + t*shaftLen:
 *   Bx(0.5) = x0 + shaftLen*(0.25 + 0.5*t)
 *   By(0.5) = bulge/2
 */
export function arrowCurveMidHandleGroupLocal(
  L: number,
  shaftLen: number,
  bulge: number,
  t = 0.5,
): Point {
  const x0 = -L / 2
  return new Point(x0 + shaftLen * (0.25 + 0.5 * t), bulge / 2)
}

/**
 * Given the user-dragged group-local position of the on-curve midpoint,
 * derive bulge and t.
 */
export function curveParamsFromDragPoint(
  L: number,
  shaftLen: number,
  strokeW: number,
  localX: number,
  localY: number,
): { bulge: number; t: number } {
  const x0 = -L / 2
  const bulge = clampArrowCurveBulge(L, strokeW, 2 * localY)
  const rawT = 2 * ((localX - x0) / shaftLen - 0.25)
  const t = clampCurveT(rawT)
  return { bulge, t }
}

/**
 * Shaft path in **tail-local** coords: tail at (0,0), tip at (shaftLen,0).
 * Keeps the tail fixed in group space when stroke/head geometry changes
 * (Fabric's `_setPath(..., true)` recenters on bbox and would drift the tail).
 */
function shaftPathDFromTail(
  shaftLen: number,
  bulge: number,
  t = 0.5,
): string {
  const x0 = 0
  const x1 = shaftLen
  if (bulge === 0) {
    return `M ${x0} 0 L ${x1} 0`
  }
  const cx = t * shaftLen
  return `M ${x0} 0 Q ${cx} ${bulge} ${x1} 0`
}

/** Place shaft so path tail (0,0) sits at group-local (-L/2, 0). */
function setShaftPositionAnchoredToTail(shaft: Path, L: number): void {
  const o = shaft.pathOffset
  shaft.set({
    left: -L / 2 + o.x,
    top: o.y,
    originX: 'center',
    originY: 'center',
  })
}

/**
 * Tangent angle at the shaft tip (bezier parameter s=1).
 * Tangent = 2*(P2 - P1) = direction from P1 to P2.
 * P1.x = t*shaftLen, P2.x = shaftLen → dx = (1-t)*shaftLen, dy = -bulge.
 */
function headTangentAngleDeg(
  shaftLen: number,
  bulge: number,
  t = 0.5,
): number {
  if (bulge === 0) return 0
  return (Math.atan2(-bulge, (1 - t) * shaftLen) * 180) / Math.PI
}

export function getArrowParts(
  g: Group,
): { shaft: Path; head: FabricObject | undefined } | null {
  const objs = g.getObjects()
  const shaft = objs.find((o) => o instanceof Path) as Path | undefined
  if (!shaft) return null
  const head = objs.find((o) => o !== shaft) as FabricObject | undefined
  return { shaft, head }
}

export function arrowDisplayColor(g: Group): string {
  const parts = getArrowParts(g)
  if (parts) {
    const s = parts.shaft.stroke
    if (typeof s === 'string') return s
    if (parts.head) {
      const f = parts.head.fill
      if (typeof f === 'string') return f
    }
  }
  return '#262626'
}

function arrowHeadTypeOf(head: FabricObject | undefined): ArrowHeadType | undefined {
  return (head as FabricObject & { avnacArrowHeadType?: ArrowHeadType } | undefined)?.avnacArrowHeadType
}

function createArrowHeadObject(
  type: ArrowHeadType,
  L: number,
  headLen: number,
  headHalf: number,
  color: string,
  headTilt: number,
  strokeW: number,
): FabricObject | undefined {
  if (type === 'none') return undefined

  let head: FabricObject
  if (type === 'open') {
    head = new Path(`M 0 ${-headHalf} L ${headLen} 0 L 0 ${headHalf}`, {
      left: L / 2 - headLen,
      top: 0,
      originX: 'left',
      originY: 'center',
      angle: headTilt,
      fill: '',
      stroke: color,
      strokeWidth: Math.max(1, strokeW),
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      selectable: false,
      evented: false,
      objectCaching: false,
    })
  } else if (type === 'circle') {
    const radius = Math.max(1, headHalf * 0.76)
    head = new Circle({
      radius,
      left: L / 2 - radius,
      top: 0,
      originX: 'center',
      originY: 'center',
      angle: headTilt,
      fill: color,
      stroke: null,
      strokeWidth: 0,
      selectable: false,
      evented: false,
      objectCaching: false,
    })
  } else {
    const pts: XY[] = type === 'diamond'
      ? [
        { x: 0, y: 0 },
        { x: headLen / 2, y: -headHalf },
        { x: headLen, y: 0 },
        { x: headLen / 2, y: headHalf },
      ]
      : [
        { x: 0, y: -headHalf },
        { x: headLen, y: 0 },
        { x: 0, y: headHalf },
      ]
    head = new Polygon(pts, {
      left: L / 2 - headLen,
      top: 0,
      originX: 'left',
      originY: 'center',
      angle: headTilt,
      fill: color,
      stroke: null,
      strokeWidth: 0,
      selectable: false,
      evented: false,
      objectCaching: false,
    })
  }

  ;(head as FabricObject & { avnacArrowHeadType?: ArrowHeadType }).avnacArrowHeadType = type
  return head
}

function updateArrowHeadObject(
  group: Group,
  current: FabricObject | undefined,
  type: ArrowHeadType,
  L: number,
  headLen: number,
  headHalf: number,
  color: string,
  headTilt: number,
  strokeW: number,
): FabricObject | undefined {
  if (type === 'none') {
    current?.set({ visible: false })
    return current
  }

  let head = current
  if (!head || arrowHeadTypeOf(head) !== type) {
    if (head) group.remove(head)
    head = createArrowHeadObject(type, L, headLen, headHalf, color, headTilt, strokeW)
    if (head) group.add(head)
    return head
  }

  head.set({
    left: type === 'circle' ? L / 2 - Math.max(1, headHalf * 0.76) : L / 2 - headLen,
    top: 0,
    originX: type === 'circle' ? 'center' : 'left',
    originY: 'center',
    angle: headTilt,
    fill: type === 'open' ? '' : color,
    stroke: type === 'open' ? color : null,
    strokeWidth: type === 'open' ? Math.max(1, strokeW) : 0,
    visible: true,
    scaleX: 1,
    scaleY: 1,
  })
  if (head instanceof Polygon) {
    head.set({
      points: type === 'diamond'
        ? [
          { x: 0, y: 0 },
          { x: headLen / 2, y: -headHalf },
          { x: headLen, y: 0 },
          { x: headLen / 2, y: headHalf },
        ]
        : [
          { x: 0, y: -headHalf },
          { x: headLen, y: 0 },
          { x: 0, y: headHalf },
        ],
    })
    head.setDimensions()
  } else if (head instanceof Circle) {
    head.set({ radius: Math.max(1, headHalf * 0.76) })
  } else if (head instanceof Path && type === 'open') {
    head._setPath(`M 0 ${-headHalf} L ${headLen} 0 L 0 ${headHalf}`, false)
  }
  head.setCoords()
  return head
}

function arrowGroupSize(
  L: number,
  strokeW: number,
  headHalf: number,
  bulge: number,
): { w: number; h: number } {
  const onCurvePeak = bulge / 2
  const pad = strokeW / 2
  const above = Math.max(headHalf, onCurvePeak > 0 ? onCurvePeak : 0) + pad
  const below = Math.max(headHalf, onCurvePeak < 0 ? -onCurvePeak : 0) + pad
  return { w: L + strokeW, h: above + below }
}

export function createArrowGroup(
  mod: typeof import('fabric'),
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: ArrowOpts,
): Group {
  const {
    strokeWidth: strokeW,
    headFrac,
    color,
    lineStyle,
    headType = headFrac > 0 ? 'triangle' : 'none',
    roundedEnds,
    pathType,
    curveBulge: curveBulgeOpt,
    curveT: curveTOpt,
  } = opts
  const dx = x2 - x1
  const dy = y2 - y1
  const L = Math.max(Math.hypot(dx, dy), 1)
  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
  const hf = Math.max(0, Math.min(2, headFrac))
  const { headLen, headHalf } = headGeometry(L, strokeW, headFrac)

  const shaftLen = hf < 0.01 ? L : Math.max(L - headLen, 1)
  const cap = shaftStrokeLineCap(lineStyle, roundedEnds)
  const bulge = effectiveShaftBulge(L, strokeW, pathType, curveBulgeOpt)
  const ct = curveTOpt ?? 0.5
  const pathD = shaftPathDFromTail(shaftLen, bulge, ct)
  const headTilt = headTangentAngleDeg(shaftLen, bulge, ct)

  const shaft = new mod.Path(pathD, {
    originX: 'center',
    originY: 'center',
    stroke: color,
    strokeWidth: strokeW,
    strokeLineCap: cap,
    strokeLineJoin: 'round',
    strokeDashArray: dashArrayForStyle(lineStyle, strokeW),
    fill: '',
    selectable: false,
    evented: false,
    objectCaching: false,
  })
  shaft._setPath(pathD, false)
  setShaftPositionAnchoredToTail(shaft, L)

  const effectiveHeadType = hf >= 0.01 ? headType : 'none'
  const head = createArrowHeadObject(effectiveHeadType, L, headLen, headHalf, color, headTilt, strokeW)

  const children = head ? [shaft, head] : [shaft]
  const { w, h } = arrowGroupSize(L, strokeW, headHalf, bulge)

  return new mod.Group(children, {
    left: cx,
    top: cy,
    width: w,
    height: h,
    angle: angleDeg,
    originX: 'center',
    originY: 'center',
    subTargetCheck: false,
    interactive: false,
    objectCaching: false,
    layoutManager: new LayoutManager(arrowNoopLayout),
  })
}

export function layoutArrowGroup(
  group: Group,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: ArrowOpts,
): void {
  const parts = getArrowParts(group)
  if (!parts) return
  const { shaft, head } = parts

  const {
    strokeWidth: strokeW,
    headFrac,
    color,
    lineStyle,
    headType = headFrac > 0 ? 'triangle' : 'none',
    roundedEnds,
    pathType,
    curveBulge: curveBulgeOpt,
    curveT: curveTOpt,
  } = opts
  const dx = x2 - x1
  const dy = y2 - y1
  const L = Math.max(Math.hypot(dx, dy), 1)
  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
  const hf = Math.max(0, Math.min(2, headFrac))
  const { headLen, headHalf } = headGeometry(L, strokeW, headFrac)

  const shaftLen = hf < 0.01 ? L : Math.max(L - headLen, 1)
  const cap = shaftStrokeLineCap(lineStyle, roundedEnds)
  const bulge = effectiveShaftBulge(L, strokeW, pathType, curveBulgeOpt)
  const ct = curveTOpt ?? 0.5
  const pathD = shaftPathDFromTail(shaftLen, bulge, ct)
  const headTilt = headTangentAngleDeg(shaftLen, bulge, ct)

  shaft._setPath(pathD, false)
  shaft.set({
    originX: 'center',
    originY: 'center',
    stroke: color,
    strokeWidth: strokeW,
    strokeLineCap: cap,
    strokeLineJoin: 'round',
    strokeDashArray: dashArrayForStyle(lineStyle, strokeW),
    fill: '',
    scaleX: 1,
    scaleY: 1,
    angle: 0,
  })
  setShaftPositionAnchoredToTail(shaft, L)

  const effectiveHeadType = hf >= 0.01 ? headType : 'none'
  const nextHead = updateArrowHeadObject(
    group,
    head,
    effectiveHeadType,
    L,
    headLen,
    headHalf,
    color,
    headTilt,
    strokeW,
  )

  shaft.setCoords()
  nextHead?.setCoords()

  const { w, h } = arrowGroupSize(L, strokeW, headHalf, bulge)

  group.set({
    left: cx,
    top: cy,
    angle: angleDeg,
    width: w,
    height: h,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
  })
  group.setCoords()
  group.set('dirty', true)
}

export function arrowTailTipLocal(
  g: Group,
): { tail: Point; tip: Point } | null {
  const meta = getAvnacShapeMeta(g)
  if (
    (meta?.kind === 'arrow' || meta?.kind === 'line') &&
    meta.arrowEndpoints
  ) {
    const { x1, y1, x2, y2 } = meta.arrowEndpoints
    const L = Math.max(Math.hypot(x2 - x1, y2 - y1), 1)
    return {
      tail: new Point(-L / 2, 0),
      tip: new Point(L / 2, 0),
    }
  }
  const parts = getArrowParts(g)
  if (!parts) return null
  const shaftW = parts.shaft.width ?? 0
  const head =
    parts.head && parts.head.visible !== false ? parts.head : undefined
  const headW = head ? (head.width ?? 0) : 0
  const totalHalf = (shaftW + headW) / 2
  return {
    tail: new Point(-totalHalf, 0),
    tip: new Point(totalHalf, 0),
  }
}
