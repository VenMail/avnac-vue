import type { FabricObject } from 'fabric'

// ── Logical-group membership tags ────────────────────────────────────────────
// These live as sibling Fabric props, NOT inside AvnacShapeMeta.
// Shape kind (rect, ellipse…) is orthogonal to logical-group membership.

export type AvnacGroupKind = 'infographic' | 'diagram' | 'chart'

export type AvnacGroupRole =
  | 'shape'
  | 'label'
  | 'sublabel'
  | 'value'
  | 'decoration'
  | 'frame'
  | 'arrow-head'

type GroupTagged = FabricObject & {
  avnacGroupId?: string
  avnacGroupKind?: AvnacGroupKind
  avnacGroupRole?: AvnacGroupRole
  avnacGroupItemIndex?: number
}

export function getAvnacGroupId(obj: FabricObject): string | null {
  return (obj as GroupTagged).avnacGroupId ?? null
}

export function getAvnacGroupKind(obj: FabricObject): AvnacGroupKind | null {
  return (obj as GroupTagged).avnacGroupKind ?? null
}

export function getAvnacGroupRole(obj: FabricObject): AvnacGroupRole | null {
  return (obj as GroupTagged).avnacGroupRole ?? null
}

export function setAvnacGroupTag(
  obj: FabricObject,
  opts: {
    id: string
    kind: AvnacGroupKind
    role: AvnacGroupRole
    itemIndex?: number
  },
): void {
  const t = obj as GroupTagged
  t.avnacGroupId = opts.id
  t.avnacGroupKind = opts.kind
  t.avnacGroupRole = opts.role
  if (opts.itemIndex !== undefined) t.avnacGroupItemIndex = opts.itemIndex
}

export type AvnacShapeKind =
  | 'rect'
  | 'ellipse'
  | 'polygon'
  | 'star'
  | 'line'
  | 'connector'
  | 'arrow'

export type ArrowLineStyle = 'solid' | 'dashed' | 'dotted'

export type ArrowPathType = 'straight' | 'curved'

export type AvnacShapeMeta = {
  kind: AvnacShapeKind
  polygonSides?: number
  starPoints?: number
  arrowHead?: number
  /** Scene-space tail → tip; kept in sync when editing arrow endpoints. */
  arrowEndpoints?: { x1: number; y1: number; x2: number; y2: number }
  arrowStrokeWidth?: number
  arrowLineStyle?: ArrowLineStyle
  arrowRoundedEnds?: boolean
  arrowPathType?: ArrowPathType
  /** Quadratic control-point Y in group-local coords; only for `curved`. */
  arrowCurveBulge?: number
  /** Position of the Q control-point along the shaft (0-1); only for `curved`. Default 0.5. */
  arrowCurveT?: number
}

export function getAvnacShapeMeta(
  obj: FabricObject | undefined | null,
): AvnacShapeMeta | null {
  if (!obj) return null
  const m = (obj as FabricObject & { avnacShape?: AvnacShapeMeta }).avnacShape
  return m && typeof m === 'object' && 'kind' in m ? m : null
}

export function setAvnacShapeMeta(
  obj: FabricObject,
  meta: AvnacShapeMeta | null,
): void {
  ;(obj as FabricObject & { avnacShape?: AvnacShapeMeta | null }).avnacShape =
    meta
}

/** Stroke line/arrow groups: arrow, or line drawn as a headless arrow group (not legacy `fabric.Line`). */
export function isAvnacStrokeLineLike(
  meta: AvnacShapeMeta | null | undefined,
): boolean {
  if (!meta) return false
  if (meta.kind === 'arrow') return true
  return (
    meta.kind === 'line' &&
    !!meta.arrowEndpoints &&
    meta.arrowStrokeWidth != null
  )
}

/** `layoutArrowGroup` head fraction: lines are always headless; arrows use `arrowHead`. */
export function avnacStrokeLineHeadFrac(meta: AvnacShapeMeta): number {
  return meta.kind === 'line' ? 0 : (meta.arrowHead ?? 1)
}
