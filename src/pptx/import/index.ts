import { parsePptxFile } from './pptx-parser'
import { slideToFabricObjects } from './ooxml-to-fabric'
import type { AvnacDocumentV1 } from '#/lib/avnac-document'
import { AVNAC_DOC_VERSION } from '#/lib/avnac-document'
import { OBJECT_SERIAL_KEYS } from '#/lib/avnac-document'

const ARTBOARD_W = 4000
const ARTBOARD_H = 4000

export async function importPptxFile(file: File): Promise<AvnacDocumentV1[]> {
  const slides = await parsePptxFile(file)
  const docs: AvnacDocumentV1[] = []

  for (const slide of slides) {
    const objects = slideToFabricObjects(slide)

    const fabricObjects = objects.map((spec) => {
      const obj: Record<string, unknown> = {
        type: spec.type,
        version: '6.0.0',
        originX: 'left',
        originY: 'top',
        left: spec.left,
        top: spec.top,
        width: spec.width,
        height: spec.height,
        scaleX: 1,
        scaleY: 1,
        angle: spec.angle,
        opacity: 1,
        visible: true,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
      }
      // Copy custom avnac fields
      for (const key of OBJECT_SERIAL_KEYS) {
        if (spec[key] !== undefined) obj[key] = spec[key]
      }
      // Copy type-specific fields
      const typeFields = [
        'fill', 'stroke', 'strokeWidth', 'rx', 'ry',
        'text', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
        'underline', 'textAlign', 'lineHeight', 'src',
      ] as const
      for (const key of typeFields) {
        if (spec[key] !== undefined) obj[key] = spec[key]
      }
      return obj
    })

    const doc: AvnacDocumentV1 = {
      v: AVNAC_DOC_VERSION,
      artboard: { width: ARTBOARD_W, height: ARTBOARD_H },
      bg: { type: 'solid', color: '#ffffff' },
      fabric: { objects: fabricObjects },
    }

    docs.push(doc)
  }

  return docs
}

export async function importPptxFromInput(): Promise<AvnacDocumentV1[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pptx,.ppt'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) { resolve([]); return }
      try {
        const docs = await importPptxFile(file)
        resolve(docs)
      } catch (err) {
        reject(err)
      }
    }
    input.click()
  })
}
