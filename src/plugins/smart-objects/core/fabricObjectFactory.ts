import type { Canvas, FabricObject } from 'fabric'
import type { AvnacDiagramData } from '#/lib/avnac-diagram'
import { diagramContentBounds, renderDiagram, type DiagramChildSpec } from '#/lib/avnac-diagram-render'
import type { AvnacInfographicData } from '#/lib/avnac-infographic'
import { renderInfographic, type InfographicChildSpec } from '#/lib/avnac-infographic-render'
import type {
  AvnacSmartObjectData,
  AvnacSmartObjectRole,
  SelectedSmartObjectInfo,
  SmartObjectInsertOptions,
  SmartObjectInsertResult,
} from '../types'
import { fitTextToBox } from '../text/fitTextToBox'

type FabricModule = typeof import('fabric')
type SmartChildSpec = InfographicChildSpec | DiagramChildSpec
type SmartTaggedObject = FabricObject & {
  text?: string
  fontSize?: number
  avnacAnimations?: unknown[]
  enterEditing?: () => void
  selectAll?: () => void
  isEditing?: boolean
  avnacSmartObjectId?: string
  avnacSmartObjectData?: AvnacSmartObjectData
  avnacSmartObjectRole?: AvnacSmartObjectRole
  avnacSmartNodeId?: string
  avnacSmartItemIndex?: number
}

const SMART_PROPS = [
  'avnacObjectType',
  'avnacSmartObjectId',
  'avnacSmartObjectKind',
  'avnacSmartObjectRole',
  'avnacSmartObjectData',
  'avnacSmartNodeId',
  'avnacSmartEdgeId',
  'avnacSmartItemIndex',
  'avnacGroupId',
  'avnacGroupKind',
  'avnacGroupRole',
  'avnacGroupItemIndex',
] as const

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `smart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function roleFromSpec(spec: SmartChildSpec): AvnacSmartObjectRole {
  if (spec.avnacGroupRole === 'shape') return 'shape'
  if (spec.avnacGroupRole === 'label') return 'label'
  if (spec.avnacGroupRole === 'sublabel') return 'sublabel'
  if (spec.avnacGroupRole === 'value') return 'value'
  if (spec.avnacGroupRole === 'arrow-head') return 'arrow-head'
  if (spec.type === 'Line') return 'connector'
  return 'decoration'
}

function smartObjectDataForInfographic(
  id: string,
  data: AvnacInfographicData,
  left: number,
  top: number,
  width = data.options.width,
  height = data.options.height,
): AvnacSmartObjectData {
  return {
    id,
    kind: 'infographic',
    template: data.template,
    version: 1,
    bounds: {
      x: left,
      y: top,
      width,
      height,
    },
    source: cloneJson(data),
  }
}

function smartObjectDataForDiagram(
  id: string,
  data: AvnacDiagramData,
  left: number,
  top: number,
  width?: number,
  height?: number,
): AvnacSmartObjectData {
  const bounds = diagramContentBounds(data)
  return {
    id,
    kind: data.type,
    template: data.type,
    version: 1,
    bounds: {
      x: left,
      y: top,
      width: width ?? bounds.w,
      height: height ?? bounds.h,
    },
    source: cloneJson(data),
  }
}

function applySmartMetadata(
  obj: FabricObject,
  spec: SmartChildSpec,
  smartData: AvnacSmartObjectData,
  groupKind: 'infographic' | 'diagram',
) {
  const tagged = obj as FabricObject & Record<string, unknown>
  const role = roleFromSpec(spec)

  tagged.avnacObjectType = 'smart-object-child'
  tagged.avnacSmartObjectId = smartData.id
  tagged.avnacSmartObjectKind = smartData.kind
  tagged.avnacSmartObjectRole = role
  tagged.avnacSmartObjectData = smartData
  tagged.avnacSmartItemIndex = spec.avnacGroupItemIndex
  tagged.avnacGroupId = smartData.id
  tagged.avnacGroupKind = groupKind
  tagged.avnacGroupRole = spec.avnacGroupRole ?? role
  tagged.avnacGroupItemIndex = spec.avnacGroupItemIndex

  if ('avnacDiagramNodeId' in spec) tagged.avnacSmartNodeId = spec.avnacDiagramNodeId
  if ('avnacDiagramEdgeId' in spec) tagged.avnacSmartEdgeId = spec.avnacDiagramEdgeId
}

function applyFrameMetadata(
  obj: FabricObject,
  smartData: AvnacSmartObjectData,
  groupKind: 'infographic' | 'diagram',
) {
  const tagged = obj as FabricObject & Record<string, unknown>
  tagged.avnacObjectType = 'smart-object-frame'
  tagged.avnacSmartObjectId = smartData.id
  tagged.avnacSmartObjectKind = smartData.kind
  tagged.avnacSmartObjectRole = 'frame'
  tagged.avnacSmartObjectData = smartData
  tagged.avnacSmartItemIndex = -1
  tagged.avnacGroupId = smartData.id
  tagged.avnacGroupKind = groupKind
  tagged.avnacGroupRole = 'frame'
  tagged.avnacGroupItemIndex = -1
}

function textFontSize(spec: SmartChildSpec): number {
  const base = spec.fontSize ?? 12
  const maxFromBox = Math.min(Math.max(8, spec.height * 0.85), Math.max(8, spec.width * 0.18))
  return Math.max(base, maxFromBox)
}

function textScale(transform: { scaleX: number; scaleY: number }): number {
  return Math.max(0.01, Math.min(Math.abs(transform.scaleX), Math.abs(transform.scaleY)))
}

function createFabricObject(
  mod: FabricModule,
  spec: SmartChildSpec,
  transform: { left: number; top: number; scaleX: number; scaleY: number },
): FabricObject | null {
  const fabric = mod as unknown as Record<string, new (...args: unknown[]) => FabricObject>
  const stroke = spec.stroke
  const strokeWidth = spec.strokeWidth ?? (stroke ? 1 : 0)
  const common = {
    fill: spec.fill ?? '#cccccc',
    stroke,
    strokeWidth,
    selectable: true,
    evented: true,
    hasBorders: false,
    hasControls: false,
  }

  if (spec.type === 'Rect') {
    return new fabric.Rect({
      ...common,
      left: transform.left + spec.left * transform.scaleX,
      top: transform.top + spec.top * transform.scaleY,
      width: spec.width * transform.scaleX,
      height: spec.height * transform.scaleY,
      rx: (spec.rx ?? 0) * transform.scaleX,
      ry: (spec.ry ?? 0) * transform.scaleY,
    })
  }

  if (spec.type === 'Circle') {
    return new fabric.Circle({
      ...common,
      left: transform.left + spec.left * transform.scaleX,
      top: transform.top + spec.top * transform.scaleY,
      radius: (spec.radius ?? Math.min(spec.width, spec.height) / 2) * Math.min(transform.scaleX, transform.scaleY),
    })
  }

  if (spec.type === 'Ellipse') {
    return new fabric.Ellipse({
      ...common,
      left: transform.left + spec.left * transform.scaleX,
      top: transform.top + spec.top * transform.scaleY,
      rx: (spec.rx ?? spec.width / 2) * transform.scaleX,
      ry: (spec.ry ?? spec.height / 2) * transform.scaleY,
    })
  }

  if (spec.type === 'Polygon' && spec.points) {
    return new fabric.Polygon(
      spec.points.map((point) => ({
        x: transform.left + point.x * transform.scaleX,
        y: transform.top + point.y * transform.scaleY,
      })),
      common,
    )
  }

  if (spec.type === 'Line' && spec.x1 !== undefined && spec.y1 !== undefined && spec.x2 !== undefined && spec.y2 !== undefined) {
    return new fabric.Line(
      [
        transform.left + spec.x1 * transform.scaleX,
        transform.top + spec.y1 * transform.scaleY,
        transform.left + spec.x2 * transform.scaleX,
        transform.top + spec.y2 * transform.scaleY,
      ],
      {
        stroke: spec.stroke ?? '#888888',
        strokeWidth: spec.strokeWidth ?? 1.5,
        strokeDashArray: 'dashArray' in spec ? spec.dashArray : undefined,
        selectable: true,
        evented: true,
        hasBorders: false,
        hasControls: false,
      },
    )
  }

  if (spec.type === 'Textbox' && spec.text) {
    const fontScale = textScale(transform)
    const fit = fitTextToBox({
      text: spec.text,
      width: spec.width * transform.scaleX,
      height: spec.height * transform.scaleY,
      fontWeight: spec.fontWeight,
      minFontSize: Math.max(4, 6 * fontScale),
      maxFontSize: textFontSize(spec) * fontScale,
      padding: 1,
    })

    return new fabric.Textbox(spec.text, {
      left: transform.left + spec.left * transform.scaleX,
      top: transform.top + spec.top * transform.scaleY,
      width: spec.width * transform.scaleX,
      height: spec.height * transform.scaleY,
      fontFamily: 'Inter',
      fontSize: fit.fontSize,
      fontWeight: spec.fontWeight ?? 'normal',
      lineHeight: fit.lineHeight,
      textAlign: spec.textAlign ?? 'left',
      fill: spec.fill ?? '#262626',
      selectable: true,
      evented: true,
      editable: true,
      hasBorders: false,
      hasControls: false,
      splitByGrapheme: true,
    })
  }

  return null
}

function createSmartFrameObject(mod: FabricModule, smartData: AvnacSmartObjectData): FabricObject {
  const fabric = mod as unknown as Record<string, new (...args: unknown[]) => FabricObject>
  return new fabric.Rect({
    left: smartData.bounds.x,
    top: smartData.bounds.y,
    width: smartData.bounds.width,
    height: smartData.bounds.height,
    fill: 'rgba(0,0,0,0)',
    strokeWidth: 0,
    opacity: 0,
    selectable: false,
    evented: false,
    hasBorders: false,
    hasControls: false,
    hoverCursor: 'default',
  })
}

function selectInsertedObjects(canvas: Canvas, mod: FabricModule, objects: FabricObject[]) {
  if (!objects.length) return
  canvas.discardActiveObject()
  canvas.setActiveObject(new mod.ActiveSelection(objects, { canvas }))
  canvas.requestRenderAll()
}

function addSmartObjects(
  canvas: Canvas,
  mod: FabricModule,
  specs: SmartChildSpec[],
  smartData: AvnacSmartObjectData,
  groupKind: 'infographic' | 'diagram',
  baseSize: { width: number; height: number; offsetX?: number; offsetY?: number },
): SmartObjectInsertResult {
  const objects: FabricObject[] = []
  const scaleX = smartData.bounds.width / Math.max(1, baseSize.width)
  const scaleY = smartData.bounds.height / Math.max(1, baseSize.height)
  const transform = {
    left: smartData.bounds.x - (baseSize.offsetX ?? 0) * scaleX,
    top: smartData.bounds.y - (baseSize.offsetY ?? 0) * scaleY,
    scaleX,
    scaleY,
  }

  const frame = createSmartFrameObject(mod, smartData)
  applyFrameMetadata(frame, smartData, groupKind)
  canvas.add(frame)
  frame.setCoords()
  objects.push(frame)

  for (const spec of specs) {
    const obj = createFabricObject(mod, spec, transform)
    if (!obj) continue
    applySmartMetadata(obj, spec, smartData, groupKind)
    canvas.add(obj)
    obj.setCoords()
    objects.push(obj)
  }

  selectInsertedObjects(canvas, mod, objects)
  return { id: smartData.id, objects }
}

export function insertInfographicSmartObject(
  canvas: Canvas,
  mod: FabricModule,
  data: AvnacInfographicData,
  options: SmartObjectInsertOptions = {},
): SmartObjectInsertResult {
  const id = createId()
  const left = options.left ?? 200
  const top = options.top ?? 200
  const smartData = smartObjectDataForInfographic(id, data, left, top)
  const specs = renderInfographic(data, id)
  return addSmartObjects(canvas, mod, specs, smartData, 'infographic', {
    width: data.options.width,
    height: data.options.height,
  })
}

export function insertDiagramSmartObject(
  canvas: Canvas,
  mod: FabricModule,
  data: AvnacDiagramData,
  options: SmartObjectInsertOptions = {},
): SmartObjectInsertResult {
  const id = createId()
  const left = options.left ?? 150
  const top = options.top ?? 150
  const smartData = smartObjectDataForDiagram(id, data, left, top)
  const specs = renderDiagram(data, id)
  const bounds = diagramContentBounds(data)
  return addSmartObjects(canvas, mod, specs, smartData, 'diagram', {
    width: bounds.w,
    height: bounds.h,
    offsetX: bounds.x,
    offsetY: bounds.y,
  })
}

export function ungroupSmartObjects(objects: FabricObject[], canvas?: Canvas): number {
  let count = 0
  for (const obj of objects) {
    const tagged = obj as FabricObject & Record<string, unknown>
    if (!tagged.avnacSmartObjectId) continue
    if (tagged.avnacSmartObjectRole === 'frame') {
      canvas?.remove(obj)
      count++
      continue
    }
    for (const key of SMART_PROPS) delete tagged[key]
    obj.set({ selectable: true, evented: true, hasBorders: true, hasControls: true })
    obj.setCoords()
    count++
  }
  return count
}

function getSmartId(obj: FabricObject): string | null {
  const tagged = obj as FabricObject & Record<string, unknown>
  return typeof tagged.avnacSmartObjectId === 'string'
    ? tagged.avnacSmartObjectId
    : typeof tagged.avnacGroupId === 'string'
      ? tagged.avnacGroupId
      : null
}

function getSmartMembers(canvas: Canvas, id: string): FabricObject[] {
  return canvas.getObjects().filter((obj) => getSmartId(obj) === id)
}

function sourceScaleForSmartData(data: AvnacSmartObjectData): number {
  const source = data.source
  if ('template' in source) {
    const sx = data.bounds.width / Math.max(1, source.options.width)
    const sy = data.bounds.height / Math.max(1, source.options.height)
    return Math.max(0.01, Math.min(Math.abs(sx), Math.abs(sy)))
  }

  const bounds = diagramContentBounds(source)
  const sx = data.bounds.width / Math.max(1, bounds.w)
  const sy = data.bounds.height / Math.max(1, bounds.h)
  return Math.max(0.01, Math.min(Math.abs(sx), Math.abs(sy)))
}

function logicalFontSizeFromText(target: SmartTaggedObject, data: AvnacSmartObjectData, fallback?: number): number | undefined {
  const sceneFontSize = target.fontSize
  if (typeof sceneFontSize !== 'number') return fallback
  const objectScale = Math.max(0.01, Math.abs((target.scaleY as number | undefined) ?? 1))
  const logical = (sceneFontSize * objectScale) / sourceScaleForSmartData(data)
  return Math.max(1, Math.round(logical * 10) / 10)
}

function sameObjectSet(a: FabricObject[], b: FabricObject[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((obj) => set.has(obj))
}

export function expandActiveSmartObjectSelection(canvas: Canvas, mod: FabricModule): boolean {
  const active = canvas.getActiveObject()
  if (!active) return false

  const selected = canvas.getActiveObjects()
  if (!selected.length) return false

  const ids = selected.map(getSmartId).filter((id): id is string => !!id)
  const uniqueIds = new Set(ids)
  if (uniqueIds.size !== 1 || ids.length !== selected.length) return false

  const id = ids[0]
  if ((canvas as unknown as { __avnacSmartObjectTextEditingId?: string }).__avnacSmartObjectTextEditingId === id) return false
  if (selected.some((obj) => (obj as SmartTaggedObject).isEditing)) return false

  const members = getSmartMembers(canvas, id)
  if (members.length <= 1 || sameObjectSet(members, selected)) return false

  for (const member of members) {
    member.set({ hasBorders: false, hasControls: false })
  }
  canvas.discardActiveObject()
  canvas.setActiveObject(new mod.ActiveSelection(members, { canvas }))
  canvas.requestRenderAll()
  return true
}

function isSmartTextbox(obj: unknown): obj is SmartTaggedObject {
  const maybe = obj as SmartTaggedObject | null
  const type = typeof maybe?.type === 'string' ? maybe.type.toLowerCase() : ''
  return !!maybe && (type === 'textbox' || type === 'i-text') && !!getSmartId(maybe)
}

function boundsContainPoint(obj: FabricObject, pointer: { x: number; y: number }, padding: number): boolean {
  const bounds = obj.getBoundingRect()
  return pointer.x >= bounds.left - padding
    && pointer.x <= bounds.left + bounds.width + padding
    && pointer.y >= bounds.top - padding
    && pointer.y <= bounds.top + bounds.height + padding
}

function relatedSmartTextTarget(canvas: Canvas, target: unknown): SmartTaggedObject | null {
  const tagged = target as SmartTaggedObject | null
  const id = tagged ? getSmartId(tagged) : null
  if (!tagged || !id) return null

  const textboxes = getSmartMembers(canvas, id).filter(isSmartTextbox)
  const rolePriority: AvnacSmartObjectRole[] = tagged.avnacSmartObjectRole === 'value'
    ? ['value', 'label', 'sublabel']
    : ['label', 'sublabel', 'value']

  if (tagged.avnacSmartNodeId) {
    for (const role of rolePriority) {
      const match = textboxes.find((obj) => obj.avnacSmartNodeId === tagged.avnacSmartNodeId && obj.avnacSmartObjectRole === role)
      if (match) return match
    }
  }

  if (typeof tagged.avnacSmartItemIndex === 'number') {
    for (const role of rolePriority) {
      const match = textboxes.find((obj) => obj.avnacSmartItemIndex === tagged.avnacSmartItemIndex && obj.avnacSmartObjectRole === role)
      if (match) return match
    }
  }

  return textboxes[0] ?? null
}

function smartObjectAtPointer(canvas: Canvas, pointer: { x: number; y: number } | null): SmartTaggedObject | null {
  if (!pointer) return null
  const objects = canvas.getObjects()
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i] as SmartTaggedObject
    if (!getSmartId(obj)) continue
    if (obj.avnacSmartObjectRole === 'frame') continue
    if (boundsContainPoint(obj, pointer, 6) || (obj as unknown as { containsPoint?: (point: { x: number; y: number }) => boolean }).containsPoint?.(pointer)) {
      return obj
    }
  }
  return null
}

function smartTextTargetFromPointer(canvas: Canvas, pointer: { x: number; y: number } | null): SmartTaggedObject | null {
  if (!pointer) return null
  const objects = canvas.getObjects()
  const hitPadding = 12
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]
    if (!isSmartTextbox(obj)) continue
    if (boundsContainPoint(obj, pointer, hitPadding) || (obj as unknown as { containsPoint?: (point: { x: number; y: number }) => boolean }).containsPoint?.(pointer)) {
      return obj
    }
  }
  return relatedSmartTextTarget(canvas, smartObjectAtPointer(canvas, pointer))
}

function eventScenePoint(canvas: Canvas, event: unknown): { x: number; y: number } | null {
  if (!event) return null
  const withScenePoint = canvas as Canvas & { getScenePoint?: (e: unknown) => { x: number; y: number } }
  if (withScenePoint.getScenePoint) return withScenePoint.getScenePoint(event)
  const withPointer = canvas as Canvas & { getPointer?: (e: unknown) => { x: number; y: number } }
  return withPointer.getPointer?.(event) ?? null
}

export function findSmartTextEditTarget(canvas: Canvas, eventInfo: unknown): SmartTaggedObject | null {
  const info = eventInfo as {
    target?: unknown
    subTargets?: unknown[]
    e?: unknown
  }

  if (isSmartTextbox(info.target)) return info.target
  const relatedTarget = relatedSmartTextTarget(canvas, info.target)
  if (relatedTarget) return relatedTarget

  const subTargets = info.subTargets ?? (canvas as unknown as { targets?: unknown[] }).targets ?? []
  const subTarget = subTargets.find(isSmartTextbox)
  if (subTarget) return subTarget
  const relatedSubTarget = subTargets.map((target) => relatedSmartTextTarget(canvas, target)).find((target): target is SmartTaggedObject => !!target)
  if (relatedSubTarget) return relatedSubTarget

  return smartTextTargetFromPointer(canvas, eventScenePoint(canvas, info.e))
}

export function beginSmartTextEditing(canvas: Canvas, target: SmartTaggedObject): boolean {
  const id = getSmartId(target)
  if (!id || !target.enterEditing) return false

  ;(canvas as unknown as { __avnacSmartObjectTextEditingId?: string }).__avnacSmartObjectTextEditingId = id
  ;(canvas as unknown as { __avnacDrilledGroupId?: string }).__avnacDrilledGroupId = id
  canvas.discardActiveObject()
  target.set({ selectable: true, evented: true })
  canvas.setActiveObject(target)
  target.enterEditing()
  target.selectAll?.()
  canvas.requestRenderAll()
  return true
}

export function finishSmartTextEditing(canvas: Canvas, target: SmartTaggedObject) {
  const id = getSmartId(target)
  if ((canvas as unknown as { __avnacSmartObjectTextEditingId?: string }).__avnacSmartObjectTextEditingId === id) {
    ;(canvas as unknown as { __avnacSmartObjectTextEditingId?: string | null }).__avnacSmartObjectTextEditingId = null
  }
  if ((canvas as unknown as { __avnacDrilledGroupId?: string }).__avnacDrilledGroupId === id) {
    ;(canvas as unknown as { __avnacDrilledGroupId?: string | null }).__avnacDrilledGroupId = null
  }
}

export function syncSmartTextObjectToSource(canvas: Canvas, target: SmartTaggedObject): AvnacSmartObjectData | null {
  const id = getSmartId(target)
  const data = target.avnacSmartObjectData
  if (!id || !data) return null

  const text = target.text ?? ''
  const next = cloneJson(data)
  const role = target.avnacSmartObjectRole
  let changed = false

  if ('nodes' in next.source && target.avnacSmartNodeId && role === 'label') {
    const fontSize = logicalFontSizeFromText(target, data)
    next.source.nodes = next.source.nodes.map((node) => (
      node.id === target.avnacSmartNodeId
        ? { ...node, label: text, fontSize: fontSize ?? node.fontSize }
        : node
    ))
    changed = true
  } else if ('items' in next.source && typeof target.avnacSmartItemIndex === 'number') {
    const index = target.avnacSmartItemIndex
    next.source.items = next.source.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const fontSize = logicalFontSizeFromText(target, data)
      if (role === 'value') return { ...item, value: text, valueFontSize: fontSize ?? item.valueFontSize }
      if (role === 'sublabel') return { ...item, sublabel: text, sublabelFontSize: fontSize ?? item.sublabelFontSize }
      if (role === 'label') return { ...item, label: text, fontSize: fontSize ?? item.fontSize }
      return item
    })
    changed = role === 'label' || role === 'sublabel' || role === 'value'
  }

  if (!changed) return null

  for (const member of getSmartMembers(canvas, id)) {
    ;(member as SmartTaggedObject).avnacSmartObjectData = next
  }
  return next
}

function getBounds(objects: FabricObject[]): { left: number; top: number; width: number; height: number } {
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity

  for (const obj of objects) {
    const rect = obj.getBoundingRect()
    left = Math.min(left, rect.left)
    top = Math.min(top, rect.top)
    right = Math.max(right, rect.left + rect.width)
    bottom = Math.max(bottom, rect.top + rect.height)
  }

  return {
    left: Number.isFinite(left) ? left : 0,
    top: Number.isFinite(top) ? top : 0,
    width: Number.isFinite(right - left) ? right - left : 0,
    height: Number.isFinite(bottom - top) ? bottom - top : 0,
  }
}

function hasSmartFrame(objects: FabricObject[]): boolean {
  return objects.some((obj) => (obj as SmartTaggedObject).avnacSmartObjectRole === 'frame')
}

function smartMemberAnimationKey(obj: FabricObject): string | null {
  const tagged = obj as SmartTaggedObject
  if (tagged.avnacSmartObjectRole === 'frame') return null
  const role = tagged.avnacSmartObjectRole ?? 'decoration'
  if (tagged.avnacSmartNodeId) return `node:${tagged.avnacSmartNodeId}:${role}`
  if (typeof tagged.avnacSmartItemIndex === 'number') return `item:${tagged.avnacSmartItemIndex}:${role}`
  return null
}

function collectSmartMemberAnimations(objects: FabricObject[]): Map<string, unknown[]> {
  const map = new Map<string, unknown[]>()
  for (const obj of objects) {
    const key = smartMemberAnimationKey(obj)
    const entries = (obj as SmartTaggedObject).avnacAnimations
    if (!key || !Array.isArray(entries) || entries.length === 0) continue
    map.set(key, cloneJson(entries))
  }
  return map
}

function restoreSmartMemberAnimations(objects: FabricObject[], animations: Map<string, unknown[]>) {
  if (!animations.size) return
  for (const obj of objects) {
    const key = smartMemberAnimationKey(obj)
    const entries = key ? animations.get(key) : undefined
    if (!entries) continue
    ;(obj as SmartTaggedObject).avnacAnimations = cloneJson(entries)
  }
}

function logicalBoundsFromLegacyMembers(
  bounds: { left: number; top: number; width: number; height: number },
  data: AvnacSmartObjectData | undefined,
): { left: number; top: number; width: number; height: number } {
  const source = data?.source
  if (!source || !('template' in source)) return bounds

  const sourceW = source.options.width
  const sourceH = source.options.height
  if (sourceW <= 0 || sourceH <= 0) return bounds

  const scale = Math.max(bounds.width / sourceW, bounds.height / sourceH, 0.01)
  const logicalWidth = sourceW * scale
  const logicalHeight = sourceH * scale
  const alreadyLogical = bounds.width >= logicalWidth * 0.92 && bounds.height >= logicalHeight * 0.92
  if (alreadyLogical) return bounds

  return {
    left: bounds.left + bounds.width / 2 - logicalWidth / 2,
    top: bounds.top + bounds.height / 2 - logicalHeight / 2,
    width: logicalWidth,
    height: logicalHeight,
  }
}

export function getSelectedSmartObject(canvas: Canvas): SelectedSmartObjectInfo | null {
  const active = canvas.getActiveObject()
  if (!active) return null
  const target = 'multiSelectionStacking' in active ? canvas.getActiveObjects()[0] : active
  if (!target) return null

  const tagged = target as FabricObject & { avnacSmartObjectData?: AvnacSmartObjectData }
  const data = tagged.avnacSmartObjectData
  const id = getSmartId(target)
  if (!id || !data) return null
  return { id, kind: data.kind, data }
}

export function replaceSmartObject(
  canvas: Canvas,
  mod: FabricModule,
  id: string,
  data: AvnacInfographicData | AvnacDiagramData,
): SmartObjectInsertResult | null {
  const members = getSmartMembers(canvas, id)
  if (!members.length) return null
  const rawBounds = getBounds(members)
  const existingData = (members[0] as SmartTaggedObject).avnacSmartObjectData
  const bounds = hasSmartFrame(members) ? rawBounds : logicalBoundsFromLegacyMembers(rawBounds, existingData)
  const animations = collectSmartMemberAnimations(members)

  canvas.discardActiveObject()
  for (const member of members) canvas.remove(member)

  if ('template' in data) {
    const smartData = smartObjectDataForInfographic(id, data, bounds.left, bounds.top, bounds.width, bounds.height)
    const specs = renderInfographic(data, id)
    const result = addSmartObjects(canvas, mod, specs, smartData, 'infographic', {
      width: data.options.width,
      height: data.options.height,
    })
    restoreSmartMemberAnimations(result.objects, animations)
    return result
  }

  const smartData = smartObjectDataForDiagram(id, data, bounds.left, bounds.top, bounds.width, bounds.height)
  const specs = renderDiagram(data, id)
  const baseBounds = diagramContentBounds(data)
  const result = addSmartObjects(canvas, mod, specs, smartData, 'diagram', {
    width: baseBounds.w,
    height: baseBounds.h,
    offsetX: baseBounds.x,
    offsetY: baseBounds.y,
  })
  restoreSmartMemberAnimations(result.objects, animations)
  return result
}
