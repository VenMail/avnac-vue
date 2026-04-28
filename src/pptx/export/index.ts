import type { AvnacDocumentV1 } from '#/lib/avnac-document'
import { addDocumentToPresentation } from './fabric-to-pptx'

export async function exportDocumentsToPptx(
  docs: AvnacDocumentV1[],
  filename = 'presentation.pptx',
): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()

  for (const doc of docs) {
    addDocumentToPresentation(pptx, doc)
  }

  await pptx.writeFile({ fileName: filename })
}

export async function exportDocumentToPptxBlob(doc: AvnacDocumentV1): Promise<Blob> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const pptx = new PptxGenJS()
  addDocumentToPresentation(pptx, doc)
  const data = await pptx.write({ outputType: 'blob' })
  return data as Blob
}
