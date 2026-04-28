import type PptxGenJS from 'pptxgenjs'

export interface FabricImageLike {
  left: number
  top: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  opacity?: number
  getSrc?: () => string
  _element?: HTMLImageElement
}

export function addImageToPptx(
  slide: PptxGenJS.Slide,
  obj: FabricImageLike,
  artboardW: number,
  artboardH: number,
  slideW: number,
  slideH: number,
): void {
  const src = obj.getSrc?.() ?? obj._element?.src ?? ''
  if (!src) return

  const scaleX = obj.scaleX ?? 1
  const scaleY = obj.scaleY ?? 1
  const w = (obj.width * scaleX) / artboardW * slideW
  const h = (obj.height * scaleY) / artboardH * slideH
  const x = obj.left / artboardW * slideW
  const y = obj.top / artboardH * slideH
  const rotate = Math.round(obj.angle ?? 0)
  const transparency = obj.opacity !== undefined ? Math.round((1 - obj.opacity) * 100) : 0

  // pptxgenjs expects base64 data URI or URL
  const imageData = src.startsWith('data:') ? src : src
  if (!imageData) return

  slide.addImage({
    data: imageData as `data:${string}`,
    x,
    y,
    w,
    h,
    rotate,
    transparency,
  })
}
