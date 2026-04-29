import type { Canvas, FabricObject } from 'fabric'
import { getAvnacGroupId } from './avnac-shape-meta'

export function findGroupMembers(canvas: Canvas, groupId: string): FabricObject[] {
  return canvas.getObjects().filter((o) => getAvnacGroupId(o) === groupId)
}

export function selectLogicalGroup(canvas: Canvas, groupId: string): void {
  const members = findGroupMembers(canvas, groupId)
  if (!members.length) return
  ;(canvas as any).__avnacDrilledGroupId = null

  import('fabric').then((mod) => {
    const sel = new mod.ActiveSelection(members, { canvas: canvas as any })
    canvas.setActiveObject(sel as any)
    canvas.requestRenderAll()
  })
}

export function drillIntoChild(canvas: Canvas, target: FabricObject): void {
  const id = getAvnacGroupId(target)
  ;(canvas as any).__avnacDrilledGroupId = id
  canvas.discardActiveObject()
  canvas.setActiveObject(target as any)
  canvas.requestRenderAll()
}

export function computeGroupBounds(
  members: FabricObject[],
): { left: number; top: number; width: number; height: number } {
  if (!members.length) return { left: 0, top: 0, width: 0, height: 0 }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const m of members) {
    const r = m.getBoundingRect()
    minX = Math.min(minX, r.left)
    minY = Math.min(minY, r.top)
    maxX = Math.max(maxX, r.left + r.width)
    maxY = Math.max(maxY, r.top + r.height)
  }
  return { left: minX, top: minY, width: maxX - minX, height: maxY - minY }
}

export async function cloneGroupAt(
  canvas: Canvas,
  groupId: string,
  dx: number,
  dy: number,
): Promise<void> {
  const members = findGroupMembers(canvas, groupId)
  if (!members.length) return
  const newId = ulidGroupId()
  const clones = await Promise.all(
    members.map((m) =>
      (m as any).clone().then((c: FabricObject) => {
        ;(c as any).avnacGroupId = newId
        c.set({
          left: (c.left ?? 0) + dx,
          top: (c.top ?? 0) + dy,
        })
        return c
      }),
    ),
  )
  for (const c of clones) canvas.add(c as any)
  canvas.requestRenderAll()
}

export function removeGroup(canvas: Canvas, groupId: string): void {
  const members = findGroupMembers(canvas, groupId)
  for (const m of members) canvas.remove(m)
  canvas.requestRenderAll()
}

export function ulidGroupId(): string {
  // Crypto UUID is available in all modern browsers/Node — good enough as unique id.
  return crypto.randomUUID()
}
