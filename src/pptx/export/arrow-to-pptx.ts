import type PptxGenJS from 'pptxgenjs'
import type { BgValue } from '#/lib/bg-value'
import { bgValueToPptxFill } from './color-to-pptx'

export interface FabricArrowGroupLike {
  left: number
  top: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  opacity?: number
  avnacStroke?: { width: number; paint: BgValue }
  avnacShape?: { kind: 'line' | 'arrow' }
}

export function addArrowToPptx(
  slide: PptxGenJS.Slide,
  obj: FabricArrowGroupLike,
  artboardW: number,
  artboardH: number,
  slideW: number,
  slideH: number,
): void {
  const scaleX = obj.scaleX ?? 1
  const scaleY = obj.scaleY ?? 1
  const w = Math.max(0.01, (obj.width * scaleX) / artboardW * slideW)
  const h = Math.max(0.01, (obj.height * scaleY) / artboardH * slideH)
  const x = obj.left / artboardW * slideW
  const y = obj.top / artboardH * slideH
  const rotate = Math.round(obj.angle ?? 0)
  const isArrow = obj.avnacShape?.kind === 'arrow'

  const strokePaint = obj.avnacStroke?.paint ?? { type: 'solid' as const, color: '#262626' }
  const strokeWidth = obj.avnacStroke?.width ?? 2
  const strokeFill = bgValueToPptxFill(strokePaint)
  const color = strokeFill.color ?? '000000'

  slide.addShape('line', {
    x,
    y,
    w,
    h,
    rotate,
    line: {
      color,
      width: strokeWidth,
      dashType: 'solid',
      endArrowType: isArrow ? 'arrow' : 'none',
    },
  })
}
