import type PptxGenJS from 'pptxgenjs'
import type { AvnacDiagramData, DiagramNode } from '#/lib/avnac-diagram'

export interface FabricDiagramGroupLike {
  left: number
  top: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  avnacDiagram?: AvnacDiagramData
}

function toSlide(
  artboardVal: number,
  artboardMax: number,
  slideMax: number,
): number {
  return artboardVal / artboardMax * slideMax
}

function nodeTypeToShape(type: string): PptxGenJS.ShapeType {
  switch (type) {
    case 'decision': return 'diamond' as PptxGenJS.ShapeType
    case 'terminal': return 'roundRect' as PptxGenJS.ShapeType
    default: return 'rect' as PptxGenJS.ShapeType
  }
}

export function addDiagramToPptx(
  slide: PptxGenJS.Slide,
  obj: FabricDiagramGroupLike,
  artboardW: number,
  artboardH: number,
  slideW: number,
  slideH: number,
): number {
  const diagram = obj.avnacDiagram
  if (!diagram) return 0

  const scaleX = obj.scaleX ?? 1
  const scaleY = obj.scaleY ?? 1
  const groupLeft = obj.left
  const groupTop = obj.top
  const rotate = Math.round(obj.angle ?? 0)
  let count = 0

  function nodeToSlideCoords(node: DiagramNode) {
    const absLeft = groupLeft + node.x * scaleX
    const absTop = groupTop + node.y * scaleY
    const w = node.w * scaleX
    const h = node.h * scaleY
    return {
      x: toSlide(absLeft, artboardW, slideW),
      y: toSlide(absTop, artboardH, slideH),
      w: Math.max(0.05, toSlide(w, artboardW, slideW)),
      h: Math.max(0.05, toSlide(h, artboardH, slideH)),
    }
  }

  // Draw edges as lines
  const nodeMap = new Map(diagram.nodes.map(n => [n.id, n]))
  for (const edge of diagram.edges) {
    const from = nodeMap.get(edge.fromId)
    const to = nodeMap.get(edge.toId)
    if (!from || !to) continue

    const fromCx = from.x + from.w / 2
    const fromCy = edge.fromPort === 'bottom' ? from.y + from.h : from.y
    const toCx = to.x + to.w / 2
    const toCy = edge.toPort === 'top' ? to.y : to.y + to.h

    const x1 = toSlide(groupLeft + fromCx * scaleX, artboardW, slideW)
    const y1 = toSlide(groupTop + fromCy * scaleY, artboardH, slideH)
    const x2 = toSlide(groupLeft + toCx * scaleX, artboardW, slideW)
    const y2 = toSlide(groupTop + toCy * scaleY, artboardH, slideH)

    // pptxgenjs line requires x,y,w,h (bounding box + rotate)
    const lx = Math.min(x1, x2)
    const ly = Math.min(y1, y2)
    const lw = Math.max(0.01, Math.abs(x2 - x1))
    const lh = Math.max(0.01, Math.abs(y2 - y1))

    slide.addShape('line' as PptxGenJS.ShapeType, {
      x: lx, y: ly, w: lw, h: lh, rotate,
      line: {
        color: '888888',
        width: 1.5,
        dashType: edge.style === 'dashed' ? 'dash' : 'solid',
        endArrowType: edge.arrowEnd ? 'arrow' : 'none',
      },
    })
    count++

    // Edge label
    if (edge.label) {
      slide.addText(edge.label, {
        x: (x1 + x2) / 2 - 0.5, y: (y1 + y2) / 2 - 0.1,
        w: 1, h: 0.2, fontSize: 8, color: '666666', align: 'center',
      })
      count++
    }
  }

  // Draw nodes
  for (const node of diagram.nodes) {
    const { x, y, w, h } = nodeToSlideCoords(node)
    const color = node.fill?.type === 'solid' ? node.fill.color.replace('#', '') : '4472c4'
    const shapeType = nodeTypeToShape(node.type)
    const rectRadius = node.type === 'terminal' ? 0.5 : undefined

    slide.addShape(shapeType, {
      x, y, w, h, rotate,
      fill: { color },
      rectRadius,
    })
    count++

    // Node label
    slide.addText(node.label, {
      x, y: y + h / 2 - 0.12, w, h: 0.25, rotate,
      fontSize: 10, color: 'ffffff', bold: true, align: 'center', valign: 'middle',
    })
    count++
  }
  return count
}
