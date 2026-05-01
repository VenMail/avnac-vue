import type { FabricObject } from 'fabric'
import type { AvnacEditorPlugin } from '#/lib/avnac-plugin'
import type { AvnacDiagramData } from '#/lib/avnac-diagram'
import type { AvnacInfographicData } from '#/lib/avnac-infographic'
import {
  beginSmartTextEditing,
  expandActiveSmartObjectSelection,
  findSmartTextEditTarget,
  finishSmartTextEditing,
  getSelectedSmartObject,
  insertDiagramSmartObject,
  insertInfographicSmartObject,
  replaceSmartObject,
  syncSmartTextObjectToSource,
  ungroupSmartObjects,
} from './core/fabricObjectFactory'
import type {
  AvnacSmartObjectData,
  InsertDiagramPayload,
  InsertInfographicPayload,
  ReplaceSmartObjectPayload,
  SelectedSmartObjectInfo,
  SmartObjectInsertResult,
} from './types'

function isInfographicData(value: unknown): value is AvnacInfographicData {
  const data = value as Partial<AvnacInfographicData>
  return !!data && typeof data === 'object' && typeof data.template === 'string' && Array.isArray(data.items)
}

function isDiagramData(value: unknown): value is AvnacDiagramData {
  const data = value as Partial<AvnacDiagramData>
  return !!data && typeof data === 'object' && (data.type === 'flowchart' || data.type === 'organogram') && Array.isArray(data.nodes)
}

function normalizeInfographicPayload(payload: unknown): InsertInfographicPayload {
  if (isInfographicData(payload)) return { data: payload }
  const maybePayload = payload as Partial<InsertInfographicPayload>
  if (isInfographicData(maybePayload?.data)) return maybePayload as InsertInfographicPayload
  throw new Error('smartObjects.insertInfographic requires AvnacInfographicData')
}

function normalizeDiagramPayload(payload: unknown): InsertDiagramPayload {
  if (isDiagramData(payload)) return { data: payload }
  const maybePayload = payload as Partial<InsertDiagramPayload>
  if (isDiagramData(maybePayload?.data)) return maybePayload as InsertDiagramPayload
  throw new Error('smartObjects.insertDiagram requires AvnacDiagramData')
}

function activeObjects(ctxCanvas: import('fabric').Canvas): FabricObject[] {
  const active = ctxCanvas.getActiveObject()
  if (!active) return []
  return 'multiSelectionStacking' in active ? ctxCanvas.getActiveObjects() : [active]
}

export function createAvnacSmartObjectsPlugin(): AvnacEditorPlugin {
  return {
    id: 'avnac-smart-objects',
    name: 'AVNAC Smart Objects',
    install(ctx) {
      let expandingSelection = false
      const expandSelection = () => {
        if (expandingSelection) return
        expandingSelection = true
        try {
          expandActiveSmartObjectSelection(ctx.canvas, ctx.fabric)
        } finally {
          expandingSelection = false
        }
      }
      const beginTextEdit = (eventInfo: unknown) => {
        const target = findSmartTextEditTarget(ctx.canvas, eventInfo)
        if (!target) return
        beginSmartTextEditing(ctx.canvas, target)
      }
      const beginTextEditFromDom = (event: MouseEvent) => {
        const target = findSmartTextEditTarget(ctx.canvas, { e: event })
        if (!target) return
        event.preventDefault()
        event.stopPropagation()
        beginSmartTextEditing(ctx.canvas, target)
      }
      const syncTextChange = (eventInfo: unknown) => {
        const target = (eventInfo as { target?: unknown }).target
        if (!target) return
        const data = syncSmartTextObjectToSource(ctx.canvas, target as import('fabric').FabricObject)
        if (!data) return
        ctx.canvas.fire('avnac:smart-object:changed' as never, { id: data.id, data } as never)
      }
      const syncActiveText = () => {
        const target = ctx.canvas.getActiveObject()
        if (!target) return null
        const data = syncSmartTextObjectToSource(ctx.canvas, target)
        if (!data) return null
        ctx.canvas.fire('avnac:smart-object:changed' as never, { id: data.id, data } as never)
        ctx.requestPersist()
        ctx.notifyChange()
        return data
      }
      const finishTextEdit = (eventInfo: unknown) => {
        const target = (eventInfo as { target?: unknown }).target
        if (!target) return
        const data = syncSmartTextObjectToSource(ctx.canvas, target as import('fabric').FabricObject)
        finishSmartTextEditing(ctx.canvas, target as import('fabric').FabricObject)
        if (data) {
          ctx.canvas.fire('avnac:smart-object:changed' as never, { id: data.id, data } as never)
          ctx.requestPersist()
          ctx.notifyChange()
        }
        expandSelection()
      }

      ctx.canvas.on('selection:created', expandSelection)
      ctx.canvas.on('selection:updated', expandSelection)
      ctx.canvas.on('mouse:dblclick', beginTextEdit)
      ctx.canvas.on('text:changed', syncTextChange)
      ctx.canvas.on('text:editing:exited', finishTextEdit)
      ctx.canvas.upperCanvasEl?.addEventListener('dblclick', beginTextEditFromDom)

      const cleanups = [
        () => {
          ctx.canvas.off('selection:created', expandSelection)
          ctx.canvas.off('selection:updated', expandSelection)
          ctx.canvas.off('mouse:dblclick', beginTextEdit)
          ctx.canvas.off('text:changed', syncTextChange)
          ctx.canvas.off('text:editing:exited', finishTextEdit)
          ctx.canvas.upperCanvasEl?.removeEventListener('dblclick', beginTextEditFromDom)
        },
        ctx.commands.register<unknown, SmartObjectInsertResult>(
          'smartObjects.insertInfographic',
          (payload) => {
            const normalized = normalizeInfographicPayload(payload)
            const result = insertInfographicSmartObject(ctx.canvas, ctx.fabric, normalized.data, normalized)
            ctx.requestPersist()
            ctx.notifyChange()
            return result
          },
        ),
        ctx.commands.register<unknown, SmartObjectInsertResult>(
          'smartObjects.insertDiagram',
          (payload) => {
            const normalized = normalizeDiagramPayload(payload)
            const result = insertDiagramSmartObject(ctx.canvas, ctx.fabric, normalized.data, normalized)
            ctx.requestPersist()
            ctx.notifyChange()
            return result
          },
        ),
        ctx.commands.register<void, number>('smartObjects.ungroupSelected', () => {
          const count = ungroupSmartObjects(activeObjects(ctx.canvas), ctx.canvas)
          if (count > 0) {
            ctx.canvas.discardActiveObject()
            ctx.canvas.requestRenderAll()
            ctx.requestPersist()
            ctx.notifyChange()
          }
          return count
        }),
        ctx.commands.register<void, SelectedSmartObjectInfo | null>(
          'smartObjects.getSelected',
          () => getSelectedSmartObject(ctx.canvas),
        ),
        ctx.commands.register<ReplaceSmartObjectPayload, SmartObjectInsertResult | null>(
          'smartObjects.replace',
          (payload) => {
            const result = replaceSmartObject(ctx.canvas, ctx.fabric, payload.id, payload.data)
            if (result) {
              ctx.requestPersist()
              ctx.notifyChange()
            }
            return result
          },
        ),
        ctx.commands.register<void, AvnacSmartObjectData | null>(
          'smartObjects.syncSelectedText',
          () => syncActiveText(),
        ),
      ]

      return () => cleanups.forEach((cleanup) => cleanup())
    },
  }
}
