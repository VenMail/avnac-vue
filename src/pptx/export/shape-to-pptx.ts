import type PptxGenJS from 'pptxgenjs'
import type { BgValue } from '#/lib/bg-value'
import { bgValueToPptxFill, pptxFillToSpec } from './color-to-pptx'

export interface FabricShapeLike {
  type?: string
  left: number
  top: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  opacity?: number
  rx?: number
  avnacFill?: BgValue
  avnacStroke?: { width: number; paint: BgValue }
  avnacShape?: { kind: string }
}

const PPTX_SHAPE_MAP: Record<string, string> = {
  Rect: 'rect',
  rect: 'rect',
  Ellipse: 'ellipse',
  ellipse: 'ellipse',
}

export function addShapeToPptx(
  slide: PptxGenJS.Slide,
  obj: FabricShapeLike,
  artboardW: number,
  artboardH: number,
  slideW: number,
  slideH: number,
): void {
  const fabricType = obj.type ?? 'Rect'
  const shapeType = PPTX_SHAPE_MAP[fabricType] ?? 'rect'

  const scaleX = obj.scaleX ?? 1
  const scaleY = obj.scaleY ?? 1
  const w = (obj.width * scaleX) / artboardW * slideW
  const h = (obj.height * scaleY) / artboardH * slideH
  const x = obj.left / artboardW * slideW
  const y = obj.top / artboardH * slideH
  const rotate = Math.round(obj.angle ?? 0)
  const fillBg = obj.avnacFill ?? { type: 'solid' as const, color: '#ffffff' }
  const fill = bgValueToPptxFill(fillBg)
  const fillSpec = pptxFillToSpec(fill) as PptxGenJS.ShapeFillProps

  let lineSpec: PptxGenJS.ShapeLineProps | undefined
  if (obj.avnacStroke && obj.avnacStroke.width > 0) {
    const strokeFill = bgValueToPptxFill(obj.avnacStroke.paint)
    lineSpec = {
      color: strokeFill.color ?? '000000',
      width: obj.avnacStroke.width,
      dashType: 'solid',
    }
  }

  const rectRadius = shapeType === 'rect' && obj.rx ? obj.rx / ((obj.width * scaleX) / 2) : undefined

  slide.addShape(shapeType as PptxGenJS.ShapeType, {
    x,
    y,
    w,
    h,
    rotate,
    fill: fillSpec,
    line: lineSpec,
    rectRadius,
    // opacity not supported by pptxgenjs ShapeProps
  })
}
