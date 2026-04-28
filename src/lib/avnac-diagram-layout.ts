// Reingold-Tilford simplified tree auto-layout for organogram
import type { DiagramNode, DiagramEdge } from './avnac-diagram'

interface TreeNode {
  id: string
  children: TreeNode[]
  x: number
  y: number
  subtreeW: number
}

function buildTree(
  id: string,
  childMap: Map<string, string[]>,
  nodeW: number,
  hGap: number,
): TreeNode {
  const childIds = childMap.get(id) ?? []
  const children = childIds.map(cid => buildTree(cid, childMap, nodeW, hGap))

  let subtreeW: number
  if (children.length === 0) {
    subtreeW = nodeW
  } else {
    subtreeW = children.reduce((sum, c) => sum + c.subtreeW, 0) + hGap * (children.length - 1)
  }

  return { id, children, x: 0, y: 0, subtreeW }
}

function assignX(node: TreeNode, startX: number, hGap: number): void {
  if (node.children.length === 0) {
    node.x = startX + node.subtreeW / 2
    return
  }
  let cx = startX
  for (const child of node.children) {
    assignX(child, cx, hGap)
    cx += child.subtreeW + hGap
  }
  // Center parent over children
  node.x = (node.children[0].x + node.children[node.children.length - 1].x) / 2
}

function collectPositions(node: TreeNode, depth: number, nodeH: number, vGap: number, out: Map<string, { x: number; y: number }>) {
  out.set(node.id, { x: node.x, y: depth * (nodeH + vGap) })
  for (const child of node.children) {
    collectPositions(child, depth + 1, nodeH, vGap, out)
  }
}

export function treeLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  opts: { nodeW?: number; nodeH?: number; hGap?: number; vGap?: number } = {},
): DiagramNode[] {
  const { nodeW = 160, nodeH = 50, hGap = 40, vGap = 60 } = opts

  if (nodes.length > 50) {
    console.warn('[avnac] Auto-layout capped at 50 nodes')
    return nodes
  }

  // Build child adjacency (from → to)
  const childMap = new Map<string, string[]>()
  const hasParent = new Set<string>()
  for (const edge of edges) {
    if (!childMap.has(edge.fromId)) childMap.set(edge.fromId, [])
    childMap.get(edge.fromId)!.push(edge.toId)
    hasParent.add(edge.toId)
  }

  // Find root(s): nodes with no incoming edges
  const roots = nodes.filter(n => !hasParent.has(n.id))
  if (roots.length === 0) return nodes  // Circular — skip layout

  // Build tree from first root
  const root = buildTree(roots[0].id, childMap, nodeW, hGap)
  assignX(root, 0, hGap)

  const positions = new Map<string, { x: number; y: number }>()
  collectPositions(root, 0, nodeH, vGap, positions)

  return nodes.map(n => {
    const pos = positions.get(n.id)
    if (!pos) return n
    return { ...n, x: pos.x - n.w / 2, y: pos.y }
  })
}
