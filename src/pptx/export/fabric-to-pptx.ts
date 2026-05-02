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
import { addSmartObjectToPptx, collectSmartObjectExports } from './smart-object-to-pptx'

export interface PptxSlideSize {
  widthIn: number
  heightIn: number
}

export function pptxSlideSizeFromArtboard(artboard: { width: number; height: number }): PptxSlideSize {
  const ratio = Math.max(0.1, artboard.width / Math.max(1, artboard.height))
  const heightIn = ratio >= 1 ? 7.5 : 10
  const widthIn = heightIn * ratio
  return { widthIn, heightIn }
}

// pptxgenjs assigns shape IDs starting at 2 for the first element on a blank slide.
const PPTX_SHAPE_ID_START = 2

export function addDocumentToPresentation(
  pptx: PptxGenJS,
  doc: AvnacDocumentV1,
  slideSize: PptxSlideSize = pptxSlideSizeFromArtboard(doc.artboard),
): ShapeAnimRecord[] {
  const { artboard } = doc
  const aw = artboard.width
  const ah = artboard.height
  const slideWIn = slideSize.widthIn
  const slideHIn = slideSize.heightIn

  pptx.defineLayout({ name: 'CUSTOM', width: slideWIn, height: slideHIn })
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
  const smartObjects = collectSmartObjectExports(objects)
  const exportedSmartObjectIds = new Set<string>()
  const animRecords: ShapeAnimRecord[] = []
  let shapeId = PPTX_SHAPE_ID_START

  for (let index = 0; index < objects.length; index++) {
    const raw = objects[index]
    const obj = raw as Record<string, unknown>
    const kind = (obj.avnacShape as { kind?: string } | undefined)?.kind
    const type = (obj.type as string | undefined)?.toLowerCase()
    const smartObjectId = typeof obj.avnacSmartObjectId === 'string' ? obj.avnacSmartObjectId : null
    const smartObject = smartObjectId ? smartObjects.get(smartObjectId) : null

    if (smartObjectId && smartObject && exportedSmartObjectIds.has(smartObjectId)) continue

    try {
      let added = false
      // Specialized object kinds take priority
      if (smartObject && smartObject.firstIndex === index) {
        const n = addSmartObjectToPptx(slide, smartObject, aw, ah, slideWIn, slideHIn)
        exportedSmartObjectIds.add(smartObject.id)
        shapeId += n
      } else if (smartObject) {
        continue
      } else if (kind === 'infographic') {
        const n = addInfographicToPptx(slide, obj as any, aw, ah, slideWIn, slideHIn)
        shapeId += n  // advance past the N shapes infographic added
      } else if (kind === 'diagram') {
        const n = addDiagramToPptx(slide, obj as any, aw, ah, slideWIn, slideHIn)
        shapeId += n  // advance past the N shapes diagram added
      } else if ((type === 'image' || type === 'fabricimage') && obj.avnacChart) {
        addChartToPptx(slide, obj as any, aw, ah, slideWIn, slideHIn)
        added = true
      } else if (kind === 'line' || kind === 'arrow') {
        addArrowToPptx(slide, obj as any, aw, ah, slideWIn, slideHIn)
        added = true
      } else if (type === 'textbox' || type === 'itext') {
        addTextToPptx(slide, obj as any, aw, ah, slideWIn, slideHIn)
        added = true
      } else if (type === 'image' || type === 'fabricimage') {
        addImageToPptx(slide, obj as any, aw, ah, slideWIn, slideHIn)
        added = true
      } else if (type === 'rect' || type === 'ellipse') {
        addShapeToPptx(slide, obj as any, aw, ah, slideWIn, slideHIn)
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
