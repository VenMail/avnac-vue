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
  'avnacGroupId',
  'avnacGroupKind',
  'avnacGroupRole',
  'avnacGroupItemIndex',
  'avnacObjectType',
  'avnacSmartObjectId',
  'avnacSmartObjectKind',
  'avnacSmartObjectRole',
  'avnacSmartObjectData',
  'avnacSmartNodeId',
  'avnacSmartEdgeId',
  'avnacSmartItemIndex',
  'avnacInfographicData',
  'avnacDiagramData',
  'avnacInfographic',
  'avnacDiagram',
  'avnacChartData',
  'avnacChart',
  'avnacAnimations',
  'avnacImageMask',
] as const

function sanitizePlainValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value == null) return value
  const valueType = typeof value
  if (valueType === 'string' || valueType === 'boolean') return value
  if (valueType === 'number') return Number.isFinite(value) ? value : null
  if (valueType === 'bigint') return value.toString()
  if (valueType === 'function' || valueType === 'symbol' || valueType === 'undefined') return undefined
  if (value instanceof Date) return value.toISOString()

  if (typeof Window !== 'undefined' && value instanceof Window) return undefined
  if (typeof Node !== 'undefined' && value instanceof Node) return undefined
  if (typeof Blob !== 'undefined' && value instanceof Blob) return undefined

  if (typeof value !== 'object') return undefined
  if (seen.has(value)) return undefined
  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => {
      const sanitized = sanitizePlainValue(item, seen)
      return sanitized === undefined ? null : sanitized
    })
  }

  const out: Record<string, unknown> = {}
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const sanitized = sanitizePlainValue((value as Record<string, unknown>)[key], seen)
    if (sanitized !== undefined) out[key] = sanitized
  }
  return out
}

export function cloneAvnacPlain<T>(value: T): T {
  return sanitizePlainValue(value, new WeakSet<object>()) as T
}

export function captureAvnacDocument(
  canvas: Canvas,
  opts: { w: number; h: number; bgValue: BgValue },
): AvnacDocumentV1 {
  return {
    v: AVNAC_DOC_VERSION,
    artboard: { width: opts.w, height: opts.h },
    bg: cloneAvnacPlain(opts.bgValue),
    fabric: cloneAvnacPlain(canvas.toObject([...OBJECT_SERIAL_KEYS])),
  }
}

export const AVNAC_DOC_VERSION = 2 as const
export const AVNAC_STORAGE_KEY = 'avnac-editor-document'

export type AvnacDocumentV1 = {
  v: 1 | 2
  artboard: { width: number; height: number }
  bg: BgValue
  fabric: Record<string, unknown>
}

export function parseAvnacDocument(raw: unknown): AvnacDocumentV1 | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<AvnacDocumentV1>
  // Accept v:1, v:2, or missing v (legacy) — no production data to migrate.
  if (o.v !== undefined && o.v !== 1 && o.v !== 2) return null
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
