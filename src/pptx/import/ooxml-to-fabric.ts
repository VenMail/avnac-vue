import type { ParsedSlide } from './pptx-parser'
import { emuToPx } from './emu-to-px'
import { mapPptxFont } from './font-mapper'
import { getPrstGeomSpec } from './ooxml-shapes'
import { parseOoxmlGradient } from './ooxml-gradient'
import { resolveColorEl } from './theme-resolver'
import { parseCxnSp, isLineShape, parseLineSp } from './ooxml-connectors'
import { parseGrpSp } from './ooxml-groups'
import { parseGraphicFrameChart } from './ooxml-charts'
import type { BgValue } from '#/lib/bg-value'

const ARTBOARD_W = 4000
const ARTBOARD_H = 4000

function q(el: Element | Document | null | undefined, selector: string): Element | null {
  return el?.querySelector(selector) ?? null
}

function qs(el: Element | Document | null | undefined, selector: string): Element[] {
  return el ? Array.from(el.querySelectorAll(selector)) : []
}

function emuX(emu: string | null, slideW: number) {
  return emuToPx(parseInt(emu ?? '0', 10), ARTBOARD_W, slideW)
}
function emuY(emu: string | null, slideH: number) {
  return emuToPx(parseInt(emu ?? '0', 10), ARTBOARD_H, slideH)
}

function parseColorEl(el: Element | null, themeColors: Map<string, string>): string {
  return resolveColorEl(el, themeColors)
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

function getFlip(spPr: Element | null): { flipH: boolean; flipV: boolean } {
  const xfrm = q(spPr, 'xfrm')
  return {
    flipH: xfrm?.getAttribute('flipH') === '1',
    flipV: xfrm?.getAttribute('flipV') === '1',
  }
}

function getFill(spPr: Element | null, themeColors: Map<string, string>): BgValue {
  if (!spPr) return { type: 'solid', color: '#cccccc' }

  const noFill = q(spPr, 'noFill')
  if (noFill) return { type: 'solid', color: 'transparent' }

  const solidFill = q(spPr, 'solidFill')
  if (solidFill) {
    const color = parseColorEl(solidFill, themeColors)
    return { type: 'solid', color }
  }

  const gradFill = q(spPr, 'gradFill')
  if (gradFill) {
    return parseOoxmlGradient(gradFill, themeColors)
  }

  return { type: 'solid', color: '#cccccc' }
}

type StrokeSpec = { width: number; paint: BgValue } | null
type FabricObjectSpecResult = FabricObjectSpec | FabricObjectSpec[] | null

function getStroke(spPr: Element | null, themeColors: Map<string, string>): StrokeSpec {
  if (!spPr) return null
  const ln = q(spPr, 'ln')
  if (!ln) return null
  const noFill = q(ln, 'noFill')
  if (noFill) return null
  const solidFill = q(ln, 'solidFill')
  const color = parseColorEl(solidFill, themeColors)
  const wAttr = ln.getAttribute('w')
  const width = wAttr ? Math.round(parseInt(wAttr, 10) / 12700) : 1
  if (width === 0) return null
  return { width, paint: { type: 'solid', color } }
}

function hasVisualShape(spPr: Element | null, stroke: StrokeSpec): boolean {
  if (!spPr) return false
  return !!stroke || !!q(spPr, 'solidFill') || !!q(spPr, 'gradFill') || !!q(spPr, 'blipFill')
}

export interface FabricObjectSpec {
  type: string
  left: number
  top: number
  width: number
  height: number
  angle: number
  scaleX?: number
  scaleY?: number
  fill?: string
  avnacFill?: BgValue
  rx?: number
  ry?: number
  strokeWidth?: number
  stroke?: string
  avnacStroke?: { width: number; paint: BgValue }
  text?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  underline?: boolean
  textAlign?: string
  lineHeight?: number
  avnacFill_text?: { type: 'solid'; color: string }
  src?: string
  points?: Array<{ x: number; y: number }>
  avnacShape?: { kind: string; [k: string]: unknown }
  avnacChart?: unknown
  avnacChartPlaceholder?: boolean
  [key: string]: unknown
}

function createShapeSpec(
  prst: string,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  scaleX: number,
  scaleY: number,
  fill: BgValue,
  stroke: StrokeSpec,
): FabricObjectSpec {
  const spec = getPrstGeomSpec(prst)
  const fillColor = fill.type === 'solid' ? fill.color : '#cccccc'

  if (spec.type === 'Ellipse') {
    return {
      type: 'Ellipse',
      left: x, top: y, width: w, height: h, angle, scaleX, scaleY,
      fill: fillColor, avnacFill: fill,
      rx: w / 2, ry: h / 2,
      strokeWidth: stroke?.width ?? 0,
      stroke: stroke ? (stroke.paint as any).color : undefined,
      avnacStroke: stroke ?? undefined,
    }
  }

  if (spec.type === 'Polygon') {
    const points = spec.pointsFn(w, h)
    return {
      type: 'Polygon',
      left: x, top: y, width: w, height: h, angle, scaleX, scaleY,
      fill: fillColor, avnacFill: fill,
      points,
      strokeWidth: stroke?.width ?? 0,
      stroke: stroke ? (stroke.paint as any).color : undefined,
      avnacStroke: stroke ?? undefined,
    }
  }

  let rx = spec.type === 'Rect' ? (spec.rx ?? 0) : 0
  if (rx === 999) rx = Math.min(h / 2, w / 2)
  if (prst === 'roundRect' && rx === 8) rx = Math.min(12, w * 0.1)

  return {
    type: 'Rect',
    left: x, top: y, width: w, height: h, angle, scaleX, scaleY,
    fill: fillColor, avnacFill: fill,
    rx, ry: rx,
    strokeWidth: stroke?.width ?? 0,
    stroke: stroke ? (stroke.paint as any).color : undefined,
    avnacStroke: stroke ?? undefined,
  }
}

function pushSpec(out: FabricObjectSpec[], spec: FabricObjectSpecResult) {
  if (!spec) return
  if (Array.isArray(spec)) out.push(...spec)
  else out.push(spec)
}

// Parse a single sp element
function parseSp(
  sp: Element,
  slideW: number,
  slideH: number,
  themeColors: Map<string, string>,
): FabricObjectSpecResult {
  const spPr = q(sp, 'spPr')
  const txBody = q(sp, 'txBody')
  const prstGeom = q(spPr, 'prstGeom')
  const prst = prstGeom?.getAttribute('prst') ?? 'rect'

  const { x, y, w, h } = getOffPos(spPr, slideW, slideH)
  const angle = getAngle(spPr)
  const { flipH, flipV } = getFlip(spPr)
  const fill = getFill(spPr, themeColors)
  const stroke = getStroke(spPr, themeColors)
  const scaleX = flipH ? -1 : 1
  const scaleY = flipV ? -1 : 1

  // Connectors disguised as sp
  if (isLineShape(prst)) {
    return parseLineSp(sp, prst, slideW, slideH, themeColors)
  }

  if (txBody) {
    // Text box / shape with text
    const paragraphs = qs(txBody, 'p')
    const lines: string[] = []
    let fontFamily = 'Inter'
    let fontSize = 24
    let bold = false
    let italic = false
    let underline = false
    let textAlign = 'left'
    let textColor = '#000000'

    for (const p of paragraphs) {
      const pPr = q(p, 'pPr')
      if (pPr) {
        const algn = pPr.getAttribute('algn')
        if (algn) textAlign = { l: 'left', ctr: 'center', r: 'right', just: 'justify' }[algn] ?? 'left'
      }
      const runs = qs(p, 'r')
      let lineText = ''
      for (const r of runs) {
        const rPr = q(r, 'rPr')
        if (rPr) {
          const f = rPr.getAttribute('b'); if (f === '1' || f === 'true') bold = true
          const fi = rPr.getAttribute('i'); if (fi === '1' || fi === 'true') italic = true
          const u = rPr.getAttribute('u'); if (u && u !== 'none') underline = true
          const sz = rPr.getAttribute('sz'); if (sz) fontSize = Math.round(parseInt(sz, 10) / 100)
          const latin = q(rPr, 'latin'); if (latin) fontFamily = mapPptxFont(latin.getAttribute('typeface') ?? 'Inter')
          const solidFill = q(rPr, 'solidFill')
          if (solidFill) textColor = parseColorEl(solidFill, themeColors)
        }
        const t = q(r, 't')
        lineText += t?.textContent ?? ''
      }
      if (!lineText && runs.length === 0) {
        lineText = qs(p, 't').map((t) => t.textContent ?? '').join('')
      }
      lines.push(lineText)
    }

    const textSpec: FabricObjectSpec = {
      type: 'Textbox',
      left: x, top: y,
      width: w || 200, height: h || 50,
      angle,
      scaleX,
      scaleY,
      text: lines.join('\n'),
      fontFamily, fontSize,
      fontWeight: bold ? 'bold' : 'normal',
      fontStyle: italic ? 'italic' : 'normal',
      underline,
      textAlign,
      fill: textColor,
      avnacFill: { type: 'solid', color: textColor },
    }

    if (hasVisualShape(spPr, stroke)) {
      const shapeSpec = createShapeSpec(prst, x, y, w || 200, h || 50, angle, scaleX, scaleY, fill, stroke)
      return [shapeSpec, textSpec]
    }

    return textSpec
  }

  // Shape without text — use prstGeom lookup
  return createShapeSpec(prst, x, y, w, h, angle, scaleX, scaleY, fill, stroke)
}

// Parse a pic (image) element
function parsePic(
  pic: Element,
  slideW: number,
  slideH: number,
  mediaFiles: Map<string, string>,
): FabricObjectSpec | null {
  const spPr = q(pic, 'spPr')
  const { x, y, w, h } = getOffPos(spPr, slideW, slideH)
  const angle = getAngle(spPr)
  const { flipH, flipV } = getFlip(spPr)

  const blipFill = q(pic, 'blipFill')
  const blip = q(blipFill, 'blip')
  const rId = blip?.getAttribute('r:embed')
    ?? blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed')
    ?? ''
  const src = mediaFiles.get(rId) ?? ''
  if (!src) return null

  return {
    type: 'Image',
    left: x, top: y, width: w, height: h,
    angle,
    scaleX: flipH ? -1 : 1,
    scaleY: flipV ? -1 : 1,
    src,
  }
}

// Single-element parser used by ooxml-groups.ts recursion
function parseOne(
  el: Element,
  tag: string,
  slideW: number,
  slideH: number,
  themeColors: Map<string, string>,
  mediaFiles: Map<string, string>,
  chartXmlMap: Map<string, Document>,
): FabricObjectSpecResult {
  if (tag === 'sp') return parseSp(el, slideW, slideH, themeColors)
  if (tag === 'pic') return parsePic(el, slideW, slideH, mediaFiles)
  if (tag === 'cxnSp') return parseCxnSp(el, slideW, slideH, themeColors)
  if (tag === 'graphicFrame') return parseGraphicFrameChart(el, slideW, slideH, chartXmlMap)
  return null
}

export function slideToFabricObjects(slide: ParsedSlide): FabricObjectSpec[] {
  const { xml, mediaFiles, chartXmlMap, slideWidthEmu, slideHeightEmu, themeColors } = slide
  const objects: FabricObjectSpec[] = []
  const slideW = slideWidthEmu
  const slideH = slideHeightEmu

  const spTree = q(xml, 'spTree') ?? xml

  // Bind a parseOne closure that captures slide context
  const parseOneFn = (el: Element, tag: string, sw: number, sh: number, tc: Map<string, string>) =>
    parseOne(el, tag, sw, sh, tc, mediaFiles, chartXmlMap)

  for (const child of Array.from((spTree as Element).children ?? [])) {
    const tag = child.localName
    if (tag === 'sp') {
      const spec = parseSp(child, slideW, slideH, themeColors)
      pushSpec(objects, spec)
    } else if (tag === 'pic') {
      const spec = parsePic(child, slideW, slideH, mediaFiles)
      pushSpec(objects, spec)
    } else if (tag === 'cxnSp') {
      const spec = parseCxnSp(child, slideW, slideH, themeColors)
      pushSpec(objects, spec)
    } else if (tag === 'grpSp') {
      const specs = parseGrpSp(child, slideW, slideH, themeColors, parseOneFn)
      objects.push(...specs)
    } else if (tag === 'graphicFrame') {
      const spec = parseGraphicFrameChart(child, slideW, slideH, chartXmlMap)
      pushSpec(objects, spec)
    }
  }

  return objects
}
