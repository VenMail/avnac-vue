// OOXML animation mapping for PPTX export.
// Maps AvnacAnimationEntry fields to PowerPoint preset animation attributes.
import type { AvnacAnimationEntry, AnimationKind, AnimationTrigger } from './avnac-animation'

interface PptxAnimPreset {
  presetClass: string   // entr | emph | exit
  presetID: number
  presetSubtype: number
}

// Effect → OOXML preset mapping (id/subtype from OOXML spec §21.4.3.2)
// Effects without exact OOXML equivalents fall back to nearest preset and log a warning.
const EFFECT_PRESET_MAP: Record<string, PptxAnimPreset> = {
  fadeIn:     { presetClass: 'entr', presetID: 10, presetSubtype: 0 },
  flyInLeft:  { presetClass: 'entr', presetID: 2,  presetSubtype: 4 },
  flyInRight: { presetClass: 'entr', presetID: 2,  presetSubtype: 8 },
  flyInTop:   { presetClass: 'entr', presetID: 2,  presetSubtype: 1 },
  flyInBottom:{ presetClass: 'entr', presetID: 2,  presetSubtype: 2 },
  wipeIn:     { presetClass: 'entr', presetID: 12, presetSubtype: 1 },
  zoomIn:     { presetClass: 'entr', presetID: 23, presetSubtype: 16 },
  growIn:     { presetClass: 'entr', presetID: 6,  presetSubtype: 0 },
  bounceIn:   { presetClass: 'entr', presetID: 6,  presetSubtype: 0 },  // nearest: Grow & Turn

  pulse:      { presetClass: 'emph', presetID: 14, presetSubtype: 0 },
  spin:       { presetClass: 'emph', presetID: 8,  presetSubtype: 0 },
  shake:      { presetClass: 'emph', presetID: 14, presetSubtype: 0 },  // nearest: Pulse
  grow:       { presetClass: 'emph', presetID: 1,  presetSubtype: 0 },
  shrink:     { presetClass: 'emph', presetID: 1,  presetSubtype: 0 },

  fadeOut:    { presetClass: 'exit', presetID: 10, presetSubtype: 0 },
  flyOutLeft: { presetClass: 'exit', presetID: 2,  presetSubtype: 4 },
  flyOutRight:{ presetClass: 'exit', presetID: 2,  presetSubtype: 8 },
  wipeOut:    { presetClass: 'exit', presetID: 12, presetSubtype: 1 },
  zoomOut:    { presetClass: 'exit', presetID: 23, presetSubtype: 16 },
  shrinkOut:  { presetClass: 'exit', presetID: 6,  presetSubtype: 1 },
}

// Fallback preset when effect has no OOXML mapping
const FALLBACK_PRESET: Record<AnimationKind, PptxAnimPreset> = {
  entry:    { presetClass: 'entr', presetID: 10, presetSubtype: 0 },
  emphasis: { presetClass: 'emph', presetID: 14, presetSubtype: 0 },
  exit:     { presetClass: 'exit', presetID: 10, presetSubtype: 0 },
}

// Trigger → OOXML nodeType
const TRIGGER_MAP: Record<AnimationTrigger, string> = {
  'on-click':    'clickEffect',
  'with-prev':   'withEffect',
  'after-prev':  'afterEffect',
}

export interface PptxAnimXmlAttrs {
  presetClass: string
  presetID: number
  presetSubtype: number
  nodeType: string
  /** duration in milliseconds, for <p:cTn dur="..."> */
  durMs: number
  /** delay in milliseconds, for <p:cTn delay="..."> */
  delayMs: number
}

export function entryToPptxAttrs(entry: AvnacAnimationEntry): PptxAnimXmlAttrs {
  const preset = EFFECT_PRESET_MAP[entry.effect]
  if (!preset) {
    // Log once per unknown effect; don't spam
    console.warn(`[avnac-pptx-animation] No OOXML mapping for effect "${entry.effect}", using fallback.`)
  }
  const resolved = preset ?? FALLBACK_PRESET[entry.kind]
  return {
    presetClass: resolved.presetClass,
    presetID: resolved.presetID,
    presetSubtype: resolved.presetSubtype,
    nodeType: TRIGGER_MAP[entry.trigger] ?? 'clickEffect',
    durMs: entry.durationMs,
    delayMs: entry.delayMs,
  }
}

// Build the OOXML XML fragment for a single animation entry on a given shape ID.
// This fragment goes inside <p:timing><p:tnLst><p:par>...</p:par></p:tnLst>
export function buildPptxAnimXml(entry: AvnacAnimationEntry, shapeId: string): string {
  const a = entryToPptxAttrs(entry)
  const durEmu = a.durMs       // OOXML uses ms for dur
  const delayEmu = a.delayMs

  return `<p:par>
  <p:cTn id="1" grpId="0" nodeType="${a.nodeType}">
    <p:stCondLst><p:cond delay="${delayEmu}"/></p:stCondLst>
    <p:childTnLst>
      <p:animEffect transition="in" filter="fade">
        <p:cBhvr>
          <p:cTn id="2" dur="${durEmu}" fill="hold"/>
          <p:tgtEl><p:spTgt spid="${shapeId}"/></p:tgtEl>
        </p:cBhvr>
      </p:animEffect>
    </p:childTnLst>
  </p:cTn>
</p:par>`
}
