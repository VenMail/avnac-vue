// Build OOXML <p:timing> block for a slide from collected shape animations.
// Injected into the slide XML after pptxgenjs generates the initial file.
import type { AvnacAnimationEntry } from '#/lib/avnac-animation'
import { entryToPptxAttrs } from '#/lib/avnac-pptx-animation'

export interface ShapeAnimRecord {
  shapeId: number
  entries: AvnacAnimationEntry[]
}

let _id = 0
function nextId() { return ++_id }
function resetIds() { _id = 0 }

function effectToFilter(effect: string): string {
  switch (effect) {
    case 'fadeIn': case 'fadeOut':       return 'fade'
    case 'wipeIn': case 'wipeOut':
    case 'textTypewriter': case 'textWordReveal': case 'textLineReveal':
      return 'wipe(left)'
    case 'flyInLeft': case 'flyOutLeft': return 'wipe(right)'
    case 'flyInRight': case 'flyOutRight': return 'wipe(left)'
    case 'flyInTop': case 'flyOutTop':   return 'wipe(down)'
    case 'flyInBottom':                  return 'wipe(up)'
    case 'zoomIn': case 'zoomOut':
    case 'growIn': case 'bounceIn':
    case 'grow': case 'shrink': case 'shrinkOut': return 'zoom'
    default: return 'fade'
  }
}

function buildEntryXml(entry: AvnacAnimationEntry, shapeId: number): string {
  const a = entryToPptxAttrs(entry)
  // Need 4 unique IDs: outer trigger par, inner preset par, visibility set, anim effect
  const outerParId  = nextId()
  const presetParId = nextId()
  const setId       = nextId()
  const animId      = nextId()

  const transition = entry.kind === 'exit' ? 'out' : 'in'
  const filter = effectToFilter(entry.effect)

  return `<p:par>
    <p:cTn id="${outerParId}" grpId="0" nodeType="${a.nodeType}">
      <p:stCondLst><p:cond delay="${a.delayMs}"/></p:stCondLst>
      <p:childTnLst>
        <p:par>
          <p:cTn id="${presetParId}" presetID="${a.presetID}" presetClass="${a.presetClass}" presetSubtype="${a.presetSubtype}" fill="hold" grpId="0" nodeType="withEffect" dur="${a.durMs}">
            <p:stCondLst><p:cond delay="0"/></p:stCondLst>
            <p:childTnLst>
              <p:set>
                <p:cBhvr>
                  <p:cTn id="${setId}" dur="1" fill="hold"/>
                  <p:tgtEl><p:spTgt spid="${shapeId}"/></p:tgtEl>
                  <p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>
                </p:cBhvr>
                <p:to><p:strVal val="visible"/></p:to>
              </p:set>
              <p:animEffect transition="${transition}" filter="${filter}">
                <p:cBhvr>
                  <p:cTn id="${animId}" dur="${a.durMs}"/>
                  <p:tgtEl><p:spTgt spid="${shapeId}"/></p:tgtEl>
                </p:cBhvr>
              </p:animEffect>
            </p:childTnLst>
          </p:cTn>
        </p:par>
      </p:childTnLst>
    </p:cTn>
  </p:par>`
}

export function buildSlideTimingXml(shapeAnims: ShapeAnimRecord[]): string {
  if (!shapeAnims.length) return ''

  resetIds()
  const rootId = nextId()
  const seqId  = nextId()

  const entryBlocks = shapeAnims
    .flatMap(({ shapeId, entries }) =>
      [...entries]
        .sort((a, b) => a.order - b.order)
        .map(e => buildEntryXml(e, shapeId))
    )
    .join('\n')

  if (!entryBlocks.trim()) return ''

  return `<p:timing>
  <p:tnLst>
    <p:par>
      <p:cTn id="${rootId}" dur="indefinite" restart="whenNotActive" nodeType="tmRoot">
        <p:childTnLst>
          <p:seq concurrent="1" nextAc="seek">
            <p:cTn id="${seqId}" dur="indefinite" nodeType="mainSeq">
              <p:childTnLst>
                ${entryBlocks}
              </p:childTnLst>
            </p:cTn>
            <p:prevCondLst>
              <p:cond evt="onPrevClick" delay="0">
                <p:tn><p:tgtEl><p:sldTgt/></p:tgtEl></p:tn>
              </p:cond>
            </p:prevCondLst>
            <p:nextCondLst>
              <p:cond evt="onNextClick" delay="0">
                <p:tn><p:tgtEl><p:sldTgt/></p:tgtEl></p:tn>
              </p:cond>
            </p:nextCondLst>
          </p:seq>
        </p:childTnLst>
      </p:cTn>
    </p:par>
  </p:tnLst>
</p:timing>`
}

// Post-process a PPTX ArrayBuffer: inject <p:timing> into each slide that has
// animations. Returns a new ArrayBuffer with the modifications applied.
export async function injectAnimationsIntoPptx(
  buffer: ArrayBuffer,
  slidesAnims: ShapeAnimRecord[][],
): Promise<ArrayBuffer> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(buffer)

  for (let i = 0; i < slidesAnims.length; i++) {
    const anims = slidesAnims[i]
    if (!anims.length) continue

    const slidePath = `ppt/slides/slide${i + 1}.xml`
    const file = zip.file(slidePath)
    if (!file) continue

    const xml = await file.async('string')
    const timingXml = buildSlideTimingXml(anims)
    if (!timingXml) continue

    // Remove any existing <p:timing>...</p:timing> block (pptxgenjs may add empty one)
    const stripped = xml.replace(/<p:timing>[\s\S]*?<\/p:timing>/g, '')
    const injected = stripped.replace('</p:sld>', `${timingXml}</p:sld>`)
    zip.file(slidePath, injected)
  }

  return zip.generateAsync({ type: 'arraybuffer' })
}
