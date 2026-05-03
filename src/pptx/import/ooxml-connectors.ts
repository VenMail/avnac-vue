import type { FabricObjectSpec } from './ooxml-to-fabric'
import { emuToPx } from './emu-to-px'
import { resolveColorEl } from './theme-resolver'

const ARTBOARD_W = 4000
const ARTBOARD_H = 4000

function q(el: Element | null | undefined, selector: string): Element | null {
  return el?.querySelector(selector) ?? null
}

function emuX(emu: string | null, slideW: number) {
  return emuToPx(parseInt(emu ?? '0', 10), ARTBOARD_W, slideW)
}
function emuY(emu: string | null, slideH: number) {
  return emuToPx(parseInt(emu ?? '0', 10), ARTBOARD_H, slideH)
}

function getOffPos(spPr: Element | null, slideW: number, slideH: number) {
  const off = q(spPr, 'off')
  const ext = q(spPr, 'ext')
  return {
    x: emuX(off?.getAttribute('x') ?? null, slideW),
    y: emuY(off?.getAttribute('y') ?? null, slideH),
    w: emuX(ext?.getAttribute('cx') ?? null, slideW),
    h: emuY(ext?.getAttribute('cy') ?? null, slideH),
  }
}

function getAngle(spPr: Element | null): number {
  const xfrm = q(spPr, 'xfrm')
  const rot = xfrm?.getAttribute('rot')
  if (!rot) return 0
  return parseInt(rot, 10) / 60000
}

function getLineStyle(spPr: Element | null, themeColors: Map<string, string>): {
  color: string
  width: number
  isArrow: boolean
  arrowHeadType: 'none' | 'triangle' | 'open' | 'circle' | 'diamond'
  dashType: string
} {
  const ln = q(spPr, 'ln')
  const color = ln ? resolveColorEl(q(ln, 'solidFill'), themeColors) : '#262626'
  const wAttr = ln?.getAttribute('w')
  const width = wAttr ? Math.round(parseInt(wAttr, 10) / 12700) : 2

  // Check for arrow heads
  const tailEnd = q(ln, 'tailEnd')
  const headEnd = q(ln, 'headEnd')
  const rawHeadType = headEnd?.getAttribute('type') ?? tailEnd?.getAttribute('type') ?? 'none'
  const isArrow = rawHeadType !== 'none'
  const arrowHeadType =
    rawHeadType === 'oval' ? 'circle'
      : rawHeadType === 'diamond' ? 'diamond'
      : rawHeadType === 'triangle' || rawHeadType === 'arrow' ? 'triangle'
      : rawHeadType === 'stealth' ? 'open'
      : isArrow ? 'triangle' : 'none'

  // Dash type
  const prstDash = q(ln, 'prstDash')
  const dash = prstDash?.getAttribute('val') ?? 'solid'

  return { color, width, isArrow, arrowHeadType, dashType: dash }
}

// Parse a <p:cxnSp> connector element into FabricObjectSpec
export function parseCxnSp(
  cxnSp: Element,
  slideW: number,
  slideH: number,
  themeColors: Map<string, string>,
): FabricObjectSpec | null {
  const spPr = q(cxnSp, 'spPr')
  if (!spPr) return null

  const { x, y, w, h } = getOffPos(spPr, slideW, slideH)
  const angle = getAngle(spPr)
  const { color, width, isArrow, arrowHeadType } = getLineStyle(spPr, themeColors)

  return {
    type: 'Group',
    left: x,
    top: y,
    width: Math.max(1, w),
    height: Math.max(1, h),
    angle,
    avnacShape: { kind: isArrow ? 'arrow' : 'line', arrowHead: isArrow ? 1 : 0, arrowHeadType },
    avnacStroke: { width, paint: { type: 'solid', color } },
    scaleX: 1,
    scaleY: 1,
  }
}

// Detect if a <p:sp> element is actually a line/connector shape
export function isLineShape(prst: string | null): boolean {
  return prst === 'line' || prst === 'straightConnector1' || prst === 'bentConnector2'
    || prst === 'bentConnector3' || prst === 'curvedConnector2' || prst === 'curvedConnector3'
}

// Parse a line-style <p:sp> (prstGeom prst="line" etc.) into FabricObjectSpec
export function parseLineSp(
  sp: Element,
  _prst: string,
  slideW: number,
  slideH: number,
  themeColors: Map<string, string>,
): FabricObjectSpec | null {
  const spPr = q(sp, 'spPr')
  if (!spPr) return null

  const { x, y, w, h } = getOffPos(spPr, slideW, slideH)
  const angle = getAngle(spPr)
  const { color, width, isArrow, arrowHeadType } = getLineStyle(spPr, themeColors)

  return {
    type: 'Group',
    left: x,
    top: y,
    width: Math.max(1, w),
    height: Math.max(1, h),
    angle,
    avnacShape: { kind: isArrow ? 'arrow' : 'line', arrowHead: isArrow ? 1 : 0, arrowHeadType },
    avnacStroke: { width, paint: { type: 'solid', color } },
    scaleX: 1,
    scaleY: 1,
  }
}
