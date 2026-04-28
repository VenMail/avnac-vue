// Spec-based Fabric object descriptions for diagram nodes and edges
import type { DiagramNode, DiagramEdge, AvnacDiagramData } from './avnac-diagram'

export interface DiagramChildSpec {
  type: 'Rect' | 'Polygon' | 'Textbox' | 'Line'
  left: number
  top: number
  width: number
  height: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  rx?: number
  ry?: number
  points?: Array<{ x: number; y: number }>
  x1?: number; y1?: number; x2?: number; y2?: number
  text?: string
  fontSize?: number
  fontWeight?: string
  textAlign?: string
  avnacDiagramNodeId?: string
  avnacDiagramEdgeId?: string
  dashArray?: number[]
}

function nodeColor(node: DiagramNode): string {
  if (node.fill?.type === 'solid') return node.fill.color
  return '#4472c4'
}

function nodeSpecs(node: DiagramNode): DiagramChildSpec[] {
  const { x, y, w, h, type, label } = node
  const color = nodeColor(node)
  const specs: DiagramChildSpec[] = []

  if (type === 'process' || type === 'org-node') {
    specs.push({ type: 'Rect', left: x, top: y, width: w, height: h, fill: color, rx: 4, ry: 4, strokeWidth: 0, avnacDiagramNodeId: node.id })
  } else if (type === 'terminal') {
    specs.push({ type: 'Rect', left: x, top: y, width: w, height: h, fill: color, rx: h / 2, ry: h / 2, strokeWidth: 0, avnacDiagramNodeId: node.id })
  } else if (type === 'decision') {
    const pts = [
      { x: x + w / 2, y },
      { x: x + w, y: y + h / 2 },
      { x: x + w / 2, y: y + h },
      { x, y: y + h / 2 },
    ]
    specs.push({ type: 'Polygon', left: 0, top: 0, width: 1, height: 1, fill: color, strokeWidth: 0, points: pts, avnacDiagramNodeId: node.id })
  } else if (type === 'io') {
    const pts = [
      { x: x + w * 0.15, y },
      { x: x + w, y },
      { x: x + w * 0.85, y: y + h },
      { x, y: y + h },
    ]
    specs.push({ type: 'Polygon', left: 0, top: 0, width: 1, height: 1, fill: color, strokeWidth: 0, points: pts, avnacDiagramNodeId: node.id })
  }

  // Label textbox centered on node
  specs.push({
    type: 'Textbox',
    left: x + 4,
    top: y + h / 2 - 10,
    width: w - 8,
    height: 20,
    text: label,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    fill: '#ffffff',
  })

  return specs
}

function portXY(node: DiagramNode, port: string): { x: number; y: number } {
  const { x, y, w, h } = node
  switch (port) {
    case 'top': return { x: x + w / 2, y }
    case 'bottom': return { x: x + w / 2, y: y + h }
    case 'left': return { x, y: y + h / 2 }
    case 'right': return { x: x + w, y: y + h / 2 }
    default: return { x: x + w / 2, y: y + h }
  }
}

function edgeSpec(edge: DiagramEdge, nodeMap: Map<string, DiagramNode>): DiagramChildSpec | null {
  const from = nodeMap.get(edge.fromId)
  const to = nodeMap.get(edge.toId)
  if (!from || !to) return null

  const p1 = portXY(from, edge.fromPort)
  const p2 = portXY(to, edge.toPort)

  return {
    type: 'Line',
    left: 0, top: 0, width: 1, height: 1,
    x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
    stroke: '#888888',
    strokeWidth: 1.5,
    dashArray: edge.style === 'dashed' ? [4, 4] : undefined,
    avnacDiagramEdgeId: edge.id,
  }
}

export function renderDiagram(data: AvnacDiagramData): DiagramChildSpec[] {
  const { nodes, edges } = data
  const specs: DiagramChildSpec[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  // Draw edges first (under nodes)
  for (const edge of edges) {
    const spec = edgeSpec(edge, nodeMap)
    if (spec) specs.push(spec)
  }

  // Draw nodes
  for (const node of nodes) {
    specs.push(...nodeSpecs(node))
  }

  return specs
}

// Bounding box of all nodes
export function diagramBounds(data: AvnacDiagramData): { w: number; h: number } {
  if (data.nodes.length === 0) return { w: 400, h: 300 }
  let maxX = 0, maxY = 0
  for (const n of data.nodes) {
    maxX = Math.max(maxX, n.x + n.w)
    maxY = Math.max(maxY, n.y + n.h)
  }
  return { w: maxX + 20, h: maxY + 20 }
}
