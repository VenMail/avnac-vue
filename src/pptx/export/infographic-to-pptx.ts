import type PptxGenJS from 'pptxgenjs'
import type { AvnacInfographicData } from '#/lib/avnac-infographic'
import { renderInfographic } from '#/lib/avnac-infographic-render'
import type { InfographicChildSpec } from '#/lib/avnac-infographic-render'

export interface FabricInfographicGroupLike {
  left: number
  top: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  avnacInfographic?: AvnacInfographicData
}

function childToSlideCoords(
  child: InfographicChildSpec,
  groupLeft: number,
  groupTop: number,
  groupScaleX: number,
  groupScaleY: number,
  artboardW: number,
  artboardH: number,
  slideW: number,
  slideH: number,
) {
  const absLeft = groupLeft + child.left * groupScaleX
  const absTop = groupTop + child.top * groupScaleY
  const w = child.width * groupScaleX
  const h = child.height * groupScaleY
  return {
    x: absLeft / artboardW * slideW,
    y: absTop / artboardH * slideH,
    w: Math.max(0.01, w / artboardW * slideW),
    h: Math.max(0.01, h / artboardH * slideH),
  }
}

export function addInfographicToPptx(
  slide: PptxGenJS.Slide,
  obj: FabricInfographicGroupLike,
  artboardW: number,
  artboardH: number,
  slideW: number,
  slideH: number,
): void {
  const infData = obj.avnacInfographic
  if (!infData) return

  const specs = renderInfographic(infData)
  const scaleX = obj.scaleX ?? 1
  const scaleY = obj.scaleY ?? 1

  for (const child of specs) {
    const { x, y, w, h } = childToSlideCoords(
      child, obj.left, obj.top, scaleX, scaleY, artboardW, artboardH, slideW, slideH,
    )
    const rotate = Math.round(obj.angle ?? 0)
    const fill: PptxGenJS.ShapeFillProps = { color: (child.fill ?? '#cccccc').replace('#', '') }
    const line: PptxGenJS.ShapeLineProps | undefined = child.stroke && child.strokeWidth
      ? { color: child.stroke.replace('#', ''), width: child.strokeWidth }
      : undefined

    if (child.type === 'Rect' || child.type === 'Circle') {
      const rectRadius = child.type === 'Circle' ? 1 : undefined
      slide.addShape('rect' as PptxGenJS.ShapeType, { x, y, w, h, rotate, fill, line, rectRadius })
    } else if (child.type === 'Ellipse') {
      slide.addShape('ellipse' as PptxGenJS.ShapeType, { x, y, w, h, rotate, fill, line })
    } else if (child.type === 'Polygon' && child.points) {
      // Convert polygon points to pptxgenjs custom geometry
      // Normalize to 0..1 relative coords within the group's width/height space
      const gW = infData.options.width || 1
      const gH = infData.options.height || 1
      try {
        const cusPoints = child.points.map(p => ({
          x: (p.x / gW) * w,
          y: (p.y / gH) * h,
        }))
        slide.addShape('custGeom' as PptxGenJS.ShapeType, {
          x, y, w, h, rotate, fill, line,
          points: cusPoints as any,
        } as any)
      } catch {
        // Fallback to rect if custom geometry not supported
        slide.addShape('rect' as PptxGenJS.ShapeType, { x, y, w, h, rotate, fill, line })
      }
    } else if (child.type === 'Textbox' && child.text) {
      slide.addText(child.text, {
        x, y, w, h, rotate,
        fontSize: Math.round((child.fontSize ?? 12) * 0.75),
        bold: child.fontWeight === 'bold',
        align: (child.textAlign as PptxGenJS.HAlign) ?? 'left',
        color: (child.fill ?? '#262626').replace('#', ''),
        valign: 'middle',
      })
    }
  }
}
