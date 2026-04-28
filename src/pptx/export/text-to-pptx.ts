import type PptxGenJS from 'pptxgenjs'
import type { BgValue } from '#/lib/bg-value'
import { bgValueToPptxFill } from './color-to-pptx'

export interface FabricTextboxLike {
  left: number
  top: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  opacity?: number
  text?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: string | number
  fontStyle?: string
  underline?: boolean
  textAlign?: string
  lineHeight?: number
  fill?: string
  avnacFill?: BgValue
}

export function addTextToPptx(
  slide: PptxGenJS.Slide,
  obj: FabricTextboxLike,
  artboardW: number,
  artboardH: number,
  slideW: number,
  slideH: number,
): void {
  const text = obj.text ?? ''
  const scaleX = obj.scaleX ?? 1
  const scaleY = obj.scaleY ?? 1
  const w = (obj.width * scaleX) / artboardW * slideW
  const h = (obj.height * scaleY) / artboardH * slideH
  const x = obj.left / artboardW * slideW
  const y = obj.top / artboardH * slideH
  const rotate = Math.round(obj.angle ?? 0)
  const transparency = obj.opacity !== undefined ? Math.round((1 - obj.opacity) * 100) : 0

  const fontFace = obj.fontFamily ?? 'Inter'
  const fontSize = obj.fontSize ?? 24
  const bold = obj.fontWeight === 'bold' || obj.fontWeight === 700 || obj.fontWeight === '700'
  const italic = obj.fontStyle === 'italic'
  const underline = obj.underline ?? false
  const align = (obj.textAlign ?? 'left') as PptxGenJS.HAlign

  let color = 'FFFFFF'
  const fill = obj.avnacFill ?? (obj.fill ? { type: 'solid' as const, color: obj.fill } : null)
  if (fill) {
    const pptxFill = bgValueToPptxFill(fill)
    if (pptxFill.type === 'solid' && pptxFill.color) color = pptxFill.color
  }

  slide.addText(text, {
    x,
    y,
    w,
    h,
    rotate,
    transparency,
    fontFace,
    fontSize: Math.round(fontSize * 0.75), // pt conversion (px * 0.75)
    bold,
    italic,
    underline: underline ? { style: 'sng' } : undefined,
    align,
    color,
    wrap: true,
    valign: 'top',
  })
}
