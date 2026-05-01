import type PptxGenJS from 'pptxgenjs'
import type { AvnacDiagramData } from '#/lib/avnac-diagram'
import { diagramContentBounds } from '#/lib/avnac-diagram-render'
import type { AvnacInfographicData } from '#/lib/avnac-infographic'
import type { AvnacSmartObjectData } from '#/plugins/smart-objects'
import { addDiagramToPptx } from './diagram-to-pptx'
import { addInfographicToPptx } from './infographic-to-pptx'

interface FabricJsonObject {
  left?: number
  top?: number
  width?: number
  height?: number
  scaleX?: number
  scaleY?: number
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  avnacSmartObjectId?: unknown
  avnacSmartObjectData?: unknown
}

interface Bounds {
  left: number
  top: number
  width: number
  height: number
}

export interface SmartObjectExportRecord {
  id: string
  firstIndex: number
  members: FabricJsonObject[]
  data: AvnacSmartObjectData
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function isInfographicData(value: unknown): value is AvnacInfographicData {
  return isRecord(value) && typeof value.template === 'string' && Array.isArray(value.items) && isRecord(value.options)
}

function isDiagramData(value: unknown): value is AvnacDiagramData {
  return isRecord(value) && (value.type === 'flowchart' || value.type === 'organogram') && Array.isArray(value.nodes)
}

function isSmartObjectData(value: unknown): value is AvnacSmartObjectData {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.kind === 'string'
    && isRecord(value.bounds)
    && (isInfographicData(value.source) || isDiagramData(value.source))
}

function smartObjectId(obj: FabricJsonObject): string | null {
  return typeof obj.avnacSmartObjectId === 'string' ? obj.avnacSmartObjectId : null
}

function objectBounds(obj: FabricJsonObject): Bounds | null {
  const left = typeof obj.left === 'number' ? obj.left : undefined
  const top = typeof obj.top === 'number' ? obj.top : undefined
  if (left === undefined || top === undefined) return null

  const scaleX = typeof obj.scaleX === 'number' ? obj.scaleX : 1
  const scaleY = typeof obj.scaleY === 'number' ? obj.scaleY : 1

  if (
    typeof obj.x1 === 'number'
    && typeof obj.y1 === 'number'
    && typeof obj.x2 === 'number'
    && typeof obj.y2 === 'number'
  ) {
    const x = left + Math.min(obj.x1, obj.x2) * scaleX
    const y = top + Math.min(obj.y1, obj.y2) * scaleY
    return {
      left: x,
      top: y,
      width: Math.abs(obj.x2 - obj.x1) * scaleX,
      height: Math.abs(obj.y2 - obj.y1) * scaleY,
    }
  }

  const width = typeof obj.width === 'number' ? obj.width * scaleX : 0
  const height = typeof obj.height === 'number' ? obj.height * scaleY : 0
  return { left, top, width, height }
}

function unionBounds(objects: FabricJsonObject[], fallback: Bounds): Bounds {
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity

  for (const obj of objects) {
    const bounds = objectBounds(obj)
    if (!bounds) continue
    left = Math.min(left, bounds.left)
    top = Math.min(top, bounds.top)
    right = Math.max(right, bounds.left + bounds.width)
    bottom = Math.max(bottom, bounds.top + bounds.height)
  }

  if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(right) || !Number.isFinite(bottom)) {
    return fallback
  }

  return {
    left,
    top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  }
}

export function collectSmartObjectExports(objects: unknown[]): Map<string, SmartObjectExportRecord> {
  const records = new Map<string, SmartObjectExportRecord>()

  objects.forEach((raw, index) => {
    const obj = raw as FabricJsonObject
    const id = smartObjectId(obj)
    if (!id) return

    const record = records.get(id)
    if (record) {
      record.members.push(obj)
      if (!isSmartObjectData(record.data) && isSmartObjectData(obj.avnacSmartObjectData)) {
        record.data = obj.avnacSmartObjectData
      }
      return
    }

    if (!isSmartObjectData(obj.avnacSmartObjectData)) return
    records.set(id, {
      id,
      firstIndex: index,
      members: [obj],
      data: obj.avnacSmartObjectData,
    })
  })

  return records
}

export function addSmartObjectToPptx(
  slide: PptxGenJS.Slide,
  record: SmartObjectExportRecord,
  artboardW: number,
  artboardH: number,
  slideW: number,
  slideH: number,
): number {
  const fallback = {
    left: record.data.bounds.x,
    top: record.data.bounds.y,
    width: record.data.bounds.width,
    height: record.data.bounds.height,
  }
  const bounds = unionBounds(record.members, fallback)

  if (isInfographicData(record.data.source)) {
    const baseWidth = record.data.source.options.width || bounds.width
    const baseHeight = record.data.source.options.height || bounds.height
    return addInfographicToPptx(
      slide,
      {
        left: bounds.left,
        top: bounds.top,
        width: baseWidth,
        height: baseHeight,
        scaleX: bounds.width / Math.max(1, baseWidth),
        scaleY: bounds.height / Math.max(1, baseHeight),
        angle: 0,
        avnacInfographic: record.data.source,
      },
      artboardW,
      artboardH,
      slideW,
      slideH,
    )
  }

  if (isDiagramData(record.data.source)) {
    const base = diagramContentBounds(record.data.source)
    const scaleX = bounds.width / Math.max(1, base.w)
    const scaleY = bounds.height / Math.max(1, base.h)
    return addDiagramToPptx(
      slide,
      {
        left: bounds.left - base.x * scaleX,
        top: bounds.top - base.y * scaleY,
        width: base.w,
        height: base.h,
        scaleX,
        scaleY,
        angle: 0,
        avnacDiagram: record.data.source,
      },
      artboardW,
      artboardH,
      slideW,
      slideH,
    )
  }

  return 0
}
