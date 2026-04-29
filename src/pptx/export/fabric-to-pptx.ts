import type PptxGenJS from 'pptxgenjs'
import type { AvnacDocumentV1 } from '#/lib/avnac-document'
import type { AvnacAnimationEntry } from '#/lib/avnac-animation'
import type { ShapeAnimRecord } from './animation-to-pptx'
import { bgValueToPptxFill } from './color-to-pptx'
import { addShapeToPptx } from './shape-to-pptx'
import { addTextToPptx } from './text-to-pptx'
import { addImageToPptx } from './image-to-pptx'
import { addArrowToPptx } from './arrow-to-pptx'
import { addChartToPptx } from './chart-to-pptx'
import { addInfographicToPptx } from './infographic-to-pptx'
import { addDiagramToPptx } from './diagram-to-pptx'

const SLIDE_W_IN = 10
const SLIDE_H_IN = 7.5

// pptxgenjs assigns shape IDs starting at 2 for the first element on a blank slide.
const PPTX_SHAPE_ID_START = 2

export function addDocumentToPresentation(
  pptx: PptxGenJS,
  doc: AvnacDocumentV1,
): ShapeAnimRecord[] {
  const { artboard } = doc
  const aw = artboard.width
  const ah = artboard.height

  pptx.defineLayout({ name: 'CUSTOM', width: SLIDE_W_IN, height: SLIDE_H_IN })
  pptx.layout = 'CUSTOM'

  const slide = pptx.addSlide()

  // Background
  const bgFill = bgValueToPptxFill(doc.bg)
  if (bgFill.type === 'solid' && bgFill.color) {
    slide.background = { color: bgFill.color }
  } else if (bgFill.type === 'gradient' && bgFill.stops) {
    slide.background = { color: bgFill.stops[0]?.color ?? 'FFFFFF' }
  } else {
    slide.background = { color: 'FFFFFF' }
  }

  const objects = (doc.fabric as { objects?: unknown[] }).objects ?? []
  const animRecords: ShapeAnimRecord[] = []
  let shapeId = PPTX_SHAPE_ID_START

  for (const raw of objects) {
    const obj = raw as Record<string, unknown>
    const kind = (obj.avnacShape as { kind?: string } | undefined)?.kind
    const type = (obj.type as string | undefined)?.toLowerCase()

    try {
      let added = false
      // Specialized object kinds take priority
      if (kind === 'infographic') {
        addInfographicToPptx(slide, obj as any, aw, ah, SLIDE_W_IN, SLIDE_H_IN)
        // Infographic adds multiple shapes — skip per-object animation for now.
        added = false
      } else if (kind === 'diagram') {
        addDiagramToPptx(slide, obj as any, aw, ah, SLIDE_W_IN, SLIDE_H_IN)
        added = false
      } else if ((type === 'image' || type === 'fabricimage') && obj.avnacChart) {
        addChartToPptx(slide, obj as any, aw, ah, SLIDE_W_IN, SLIDE_H_IN)
        added = true
      } else if (kind === 'line' || kind === 'arrow') {
        addArrowToPptx(slide, obj as any, aw, ah, SLIDE_W_IN, SLIDE_H_IN)
        added = true
      } else if (type === 'textbox' || type === 'itext') {
        addTextToPptx(slide, obj as any, aw, ah, SLIDE_W_IN, SLIDE_H_IN)
        added = true
      } else if (type === 'image' || type === 'fabricimage') {
        addImageToPptx(slide, obj as any, aw, ah, SLIDE_W_IN, SLIDE_H_IN)
        added = true
      } else if (type === 'rect' || type === 'ellipse') {
        addShapeToPptx(slide, obj as any, aw, ah, SLIDE_W_IN, SLIDE_H_IN)
        added = true
      }
      // polygon/star/general group: skip (no direct pptxgenjs equivalent)

      if (added) {
        const entries = (obj.avnacAnimations as AvnacAnimationEntry[] | undefined) ?? []
        if (entries.length) {
          animRecords.push({ shapeId, entries })
        }
        shapeId++
      }
    } catch (err) {
      console.warn('[avnac pptx] skipped object', type, err)
    }
  }

  return animRecords
}
