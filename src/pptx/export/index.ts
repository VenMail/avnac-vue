import type { AvnacDocumentV1 } from '#/lib/avnac-document'
import { addDocumentToPresentation, pptxSlideSizeFromArtboard } from './fabric-to-pptx'
import { injectAnimationsIntoPptx } from './animation-to-pptx'
import type { ShapeAnimRecord } from './animation-to-pptx'

export async function exportDocumentsToPptx(
  docs: AvnacDocumentV1[],
  filename = 'presentation.pptx',
): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  const slideSize = pptxSlideSizeFromArtboard(docs[0]?.artboard ?? { width: 4000, height: 2250 })

  const slidesAnims: ShapeAnimRecord[][] = []
  for (const doc of docs) {
    slidesAnims.push(addDocumentToPresentation(pptx, doc, slideSize))
  }

  const hasAnims = slidesAnims.some(a => a.length > 0)
  if (!hasAnims) {
    await pptx.writeFile({ fileName: filename })
    return
  }

  // Generate PPTX as ArrayBuffer, inject timing XML, then download.
  const buffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer
  const patched = await injectAnimationsIntoPptx(buffer, slidesAnims)

  const blob = new Blob([patched], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function exportDocumentToPptxBlob(doc: AvnacDocumentV1): Promise<Blob> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  const animRecords = addDocumentToPresentation(pptx, doc, pptxSlideSizeFromArtboard(doc.artboard))

  if (!animRecords.length) {
    const data = await pptx.write({ outputType: 'blob' })
    return data as Blob
  }

  const buffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer
  const patched = await injectAnimationsIntoPptx(buffer, [animRecords])
  return new Blob([patched], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
}
