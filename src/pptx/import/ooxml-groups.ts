// Recursively parse <p:grpSp> group shapes, applying group transform to children
import type { FabricObjectSpec } from './ooxml-to-fabric'
import { emuToPx } from './emu-to-px'

const ARTBOARD_W = 4000
const ARTBOARD_H = 4000

function q(el: Element | null | undefined, selector: string): Element | null {
  return el?.querySelector(selector) ?? null
}

interface GroupTransform {
  offX: number  // artboard px
  offY: number
  extW: number
  extH: number
  chOffX: number  // child coordinate space origin
  chOffY: number
  chExtW: number  // child coordinate space extent
  chExtH: number
}

function parseGroupXfrm(grpSpPr: Element | null, slideW: number, slideH: number): GroupTransform {
  const xfrm = q(grpSpPr, 'xfrm')
  const off = q(xfrm, 'off')
  const ext = q(xfrm, 'ext')
  const chOff = q(xfrm, 'chOff')
  const chExt = q(xfrm, 'chExt')

  return {
    offX: emuToPx(parseInt(off?.getAttribute('x') ?? '0', 10), ARTBOARD_W, slideW),
    offY: emuToPx(parseInt(off?.getAttribute('y') ?? '0', 10), ARTBOARD_H, slideH),
    extW: emuToPx(parseInt(ext?.getAttribute('cx') ?? '0', 10), ARTBOARD_W, slideW),
    extH: emuToPx(parseInt(ext?.getAttribute('cy') ?? '0', 10), ARTBOARD_H, slideH),
    chOffX: parseInt(chOff?.getAttribute('x') ?? '0', 10),
    chOffY: parseInt(chOff?.getAttribute('y') ?? '0', 10),
    chExtW: parseInt(chExt?.getAttribute('cx') ?? '1', 10),
    chExtH: parseInt(chExt?.getAttribute('cy') ?? '1', 10),
  }
}

// Transform child coordinates from group child-space → artboard space
function transformChildSpec(
  spec: FabricObjectSpec,
  gt: GroupTransform,
): FabricObjectSpec {
  // Scale factor: group's output extent / group's child coordinate extent
  const scaleX = gt.chExtW > 0 ? gt.extW / gt.chExtW : 1
  const scaleY = gt.chExtH > 0 ? gt.extH / gt.chExtH : 1

  const left = gt.offX + (spec.left - gt.chOffX) * scaleX
  const top = gt.offY + (spec.top - gt.chOffY) * scaleY
  const width = spec.width * scaleX
  const height = spec.height * scaleY

  return { ...spec, left, top, width, height }
}

// Parse a single sp/pic/cxnSp/grpSp inside a group
// Returns null for unrecognized elements
type ParseOneFn = (el: Element, tag: string, slideW: number, slideH: number, themeColors: Map<string, string>) => FabricObjectSpec | null

export function parseGrpSp(
  grpSp: Element,
  slideW: number,
  slideH: number,
  themeColors: Map<string, string>,
  parseOne: ParseOneFn,
): FabricObjectSpec[] {
  const grpSpPr = q(grpSp, 'grpSpPr')
  const gt = parseGroupXfrm(grpSpPr, slideW, slideH)

  // Create a temporary "child slide" context where child coordinates use chExt space
  // We'll parse children in that space (passing slideW=chExtW, slideH=chExtH)
  // then transform to artboard space
  const childSlideW = gt.chExtW || slideW
  const childSlideH = gt.chExtH || slideH

  const specs: FabricObjectSpec[] = []

  // Process direct children (sp, pic, cxnSp, grpSp)
  for (const child of Array.from(grpSp.children)) {
    const tag = child.localName
    if (tag === 'grpSpPr') continue  // skip group properties element

    if (tag === 'grpSp') {
      // Recurse
      const nested = parseGrpSp(child, childSlideW, childSlideH, themeColors, parseOne)
      for (const s of nested) specs.push(transformChildSpec(s, gt))
    } else {
      const spec = parseOne(child, tag, childSlideW, childSlideH, themeColors)
      if (spec) specs.push(transformChildSpec(spec, gt))
    }
  }

  return specs
}
