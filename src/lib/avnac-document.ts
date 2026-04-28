import type { Canvas } from 'fabric'
import type { BgValue } from './bg-value'

export const OBJECT_SERIAL_KEYS = [
  'avnacShape',
  'avnacLocked',
  'avnacBlur',
  'avnacFill',
  'avnacStroke',
  'avnacLayerId',
  'avnacLayerName',
  'avnacVectorBoardId',
] as const

export function captureAvnacDocument(
  canvas: Canvas,
  opts: { w: number; h: number; bgValue: BgValue },
): AvnacDocumentV1 {
  return {
    v: AVNAC_DOC_VERSION,
    artboard: { width: opts.w, height: opts.h },
    bg: opts.bgValue,
    fabric: canvas.toObject([...OBJECT_SERIAL_KEYS]),
  }
}

export const AVNAC_DOC_VERSION = 1 as const
export const AVNAC_STORAGE_KEY = 'avnac-editor-document'

export type AvnacDocumentV1 = {
  v: typeof AVNAC_DOC_VERSION
  artboard: { width: number; height: number }
  bg: BgValue
  fabric: Record<string, unknown>
}

export function parseAvnacDocument(raw: unknown): AvnacDocumentV1 | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<AvnacDocumentV1>
  if (o.v !== AVNAC_DOC_VERSION) return null
  if (
    !o.artboard ||
    typeof o.artboard.width !== 'number' ||
    typeof o.artboard.height !== 'number'
  )
    return null
  if (!o.bg || typeof o.bg !== 'object') return null
  if (!o.fabric || typeof o.fabric !== 'object') return null
  return o as AvnacDocumentV1
}
