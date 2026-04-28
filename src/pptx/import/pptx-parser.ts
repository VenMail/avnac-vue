import JSZip from 'jszip'

export interface ParsedSlide {
  slideIndex: number
  xml: Document
  rels: Document | null
  mediaFiles: Map<string, string>   // rId → data URI
  chartXmlMap: Map<string, Document> // rId → chart XML Document
  slideWidthEmu: number
  slideHeightEmu: number
  themeColors: Map<string, string>  // schemeClr name → hex
}

function parseXml(str: string): Document {
  return new DOMParser().parseFromString(str, 'application/xml')
}

function getAttrEmu(el: Element, attr: string): number {
  return parseInt(el.getAttribute(attr) ?? '0', 10)
}

async function loadThemeColors(zip: JSZip): Promise<Map<string, string>> {
  const { resolveThemeColors } = await import('./theme-resolver')
  const themeXmlStr = await zip.file('ppt/theme/theme1.xml')?.async('string') ?? null
  return resolveThemeColors(themeXmlStr)
}

export async function parsePptxFile(file: File): Promise<ParsedSlide[]> {
  const zip = await JSZip.loadAsync(file)

  // Load theme colors (shared across all slides)
  const themeColors = await loadThemeColors(zip)

  // Read presentation.xml to get slide dimensions and order
  const presXmlStr = await zip.file('ppt/presentation.xml')?.async('string') ?? ''
  const presXml = parseXml(presXmlStr)

  const sldSz = presXml.querySelector('sldSz')
  const slideWidthEmu = sldSz ? getAttrEmu(sldSz, 'cx') : 9144000
  const slideHeightEmu = sldSz ? getAttrEmu(sldSz, 'cy') : 6858000

  // Get slide order from sldIdLst
  const sldIds = Array.from(presXml.querySelectorAll('sldIdLst sldId'))

  // Read presentation.xml.rels to map rId → slide filename
  const presRelsStr = await zip.file('ppt/_rels/presentation.xml.rels')?.async('string') ?? ''
  const presRels = parseXml(presRelsStr)
  const rIdToSlide = new Map<string, string>()
  for (const rel of Array.from(presRels.querySelectorAll('Relationship'))) {
    const id = rel.getAttribute('Id') ?? ''
    const target = rel.getAttribute('Target') ?? ''
    if (target.startsWith('slides/')) rIdToSlide.set(id, `ppt/${target}`)
  }

  const slides: ParsedSlide[] = []

  for (let i = 0; i < sldIds.length; i++) {
    const rId = sldIds[i].getAttribute('r:id') ?? sldIds[i].getAttribute('id') ?? ''
    const slidePath = rIdToSlide.get(rId)
    if (!slidePath) continue

    const slideXmlStr = await zip.file(slidePath)?.async('string') ?? ''
    const slideXml = parseXml(slideXmlStr)

    // Read slide rels for media and chart references
    const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels'
    const relsStr = await zip.file(relsPath)?.async('string')
    const relsXml = relsStr ? parseXml(relsStr) : null

    // Collect media files referenced in this slide
    const mediaFiles = new Map<string, string>()
    const chartXmlMap = new Map<string, Document>()

    if (relsXml) {
      const allRels = Array.from(relsXml.querySelectorAll('Relationship'))

      // Images
      const imageRels = allRels.filter((r) => r.getAttribute('Type')?.includes('image'))
      for (const rel of imageRels) {
        const target = rel.getAttribute('Target') ?? ''
        const filename = target.split('/').pop() ?? ''
        const mediaPath = target.startsWith('../')
          ? `ppt/${target.slice(3)}`
          : `ppt/slides/${target}`
        const mediaFile = zip.file(mediaPath) ?? zip.file(`ppt/media/${filename}`)
        if (mediaFile) {
          const ext = filename.split('.').pop()?.toLowerCase() ?? 'png'
          const mimeTypes: Record<string, string> = {
            png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
            gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
          }
          const mime = mimeTypes[ext] ?? 'image/png'
          const b64 = await mediaFile.async('base64')
          mediaFiles.set(rel.getAttribute('Id') ?? '', `data:${mime};base64,${b64}`)
        }
      }

      // Charts
      const chartRels = allRels.filter((r) => r.getAttribute('Type')?.includes('chart'))
      for (const rel of chartRels) {
        const target = rel.getAttribute('Target') ?? ''
        const chartPath = target.startsWith('../')
          ? `ppt/${target.slice(3)}`
          : `ppt/slides/${target}`
        const chartStr = await zip.file(chartPath)?.async('string')
        if (chartStr) {
          chartXmlMap.set(rel.getAttribute('Id') ?? '', parseXml(chartStr))
        }
      }
    }

    slides.push({
      slideIndex: i,
      xml: slideXml,
      rels: relsXml,
      mediaFiles,
      chartXmlMap,
      slideWidthEmu,
      slideHeightEmu,
      themeColors,
    })
  }

  return slides
}
