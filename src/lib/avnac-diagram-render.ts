// Flat Fabric object spec descriptions for diagram nodes and edges.
// Each spec carries group-tag fields for flat logical-group architecture.
import type { DiagramNode, DiagramEdge, AvnacDiagramData } from './avnac-diagram'
import type { AvnacGroupRole } from './avnac-shape-meta'

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
  // Logical-group membership
  avnacGroupId?: string
  avnacGroupKind?: string
  avnacGroupRole?: AvnacGroupRole
  avnacGroupItemIndex?: number
}

function nodeColor(node: DiagramNode): string {
  if (node.fill?.type === 'solid') return node.fill.color
  return '#4472c4'
}

function tagSpec(
  spec: DiagramChildSpec,
  groupId: string | undefined,
  role: AvnacGroupRole,
  idx: number,
): DiagramChildSpec {
  if (!groupId) return spec
  return { ...spec, avnacGroupId: groupId, avnacGroupKind: 'diagram', avnacGroupRole: role, avnacGroupItemIndex: idx }
}

function nodeSpecs(node: DiagramNode, groupId: string | undefined, nodeIndex: number): DiagramChildSpec[] {
  const { x, y, w, h, type, label } = node
  const color = nodeColor(node)
  const specs: DiagramChildSpec[] = []

  if (type === 'process' || type === 'org-node') {
    specs.push(tagSpec(
      { type: 'Rect', left: x, top: y, width: w, height: h, fill: color, rx: 4, ry: 4, strokeWidth: 0, avnacDiagramNodeId: node.id },
      groupId, 'shape', nodeIndex,
    ))
  } else if (type === 'terminal') {
    specs.push(tagSpec(
      { type: 'Rect', left: x, top: y, width: w, height: h, fill: color, rx: h / 2, ry: h / 2, strokeWidth: 0, avnacDiagramNodeId: node.id },
      groupId, 'shape', nodeIndex,
    ))
  } else if (type === 'decision') {
    const pts = [
      { x: x + w / 2, y },
      { x: x + w, y: y + h / 2 },
      { x: x + w / 2, y: y + h },
      { x, y: y + h / 2 },
    ]
    specs.push(tagSpec(
      { type: 'Polygon', left: 0, top: 0, width: 1, height: 1, fill: color, strokeWidth: 0, points: pts, avnacDiagramNodeId: node.id },
      groupId, 'shape', nodeIndex,
    ))
  } else if (type === 'io') {
    const pts = [
      { x: x + w * 0.15, y },
      { x: x + w, y },
      { x: x + w * 0.85, y: y + h },
      { x, y: y + h },
    ]
    specs.push(tagSpec(
      { type: 'Polygon', left: 0, top: 0, width: 1, height: 1, fill: color, strokeWidth: 0, points: pts, avnacDiagramNodeId: node.id },
      groupId, 'shape', nodeIndex,
    ))
  }

  specs.push(tagSpec(
    {
      type: 'Textbox',
      left: x + 4,
      top: y + h / 2 - 10,
      width: w - 8,
      height: 20,
      text: label,
      fontSize: node.fontSize ?? 12,
      fontWeight: 'bold',
      textAlign: 'center',
      fill: '#ffffff',
    },
    groupId, 'label', nodeIndex,
  ))

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

// Returns elbow segments (x1y1→x2y2) for orthogonal routing.
// For simplicity, uses an L-route via the midpoint between ports.
function orthogonalSegments(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  fromPort: string,
  toPort: string,
): Array<[number, number, number, number]> {
  if ((fromPort === 'left' || fromPort === 'right') && (toPort === 'left' || toPort === 'right')) {
    const mx = (p1.x + p2.x) / 2
    return [
      [p1.x, p1.y, mx, p1.y],
      [mx, p1.y, mx, p2.y],
      [mx, p2.y, p2.x, p2.y],
    ]
  }

  const my = (p1.y + p2.y) / 2
  return [
    [p1.x, p1.y, p1.x, my],
    [p1.x, my, p2.x, my],
    [p2.x, my, p2.x, p2.y],
  ]
}

function arrowHeadPolygon(
  x2: number, y2: number,
  x1: number, y1: number,
): Array<{ x: number; y: number }> {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const len = 14, base = 8
  const tip = { x: x2, y: y2 }
  const left = {
    x: x2 - len * Math.cos(angle) + base * Math.sin(angle),
    y: y2 - len * Math.sin(angle) - base * Math.cos(angle),
  }
  const right = {
    x: x2 - len * Math.cos(angle) - base * Math.sin(angle),
    y: y2 - len * Math.sin(angle) + base * Math.cos(angle),
  }
  return [tip, left, right]
}

function edgeSpecs(
  edge: DiagramEdge,
  nodeMap: Map<string, DiagramNode>,
  groupId: string | undefined,
  edgeIndex: number,
): DiagramChildSpec[] {
  const from = nodeMap.get(edge.fromId)
  const to = nodeMap.get(edge.toId)
  if (!from || !to) return []

  const p1 = portXY(from, edge.fromPort)
  const p2 = portXY(to, edge.toPort)
  const specs: DiagramChildSpec[] = []
  const dash = edge.style === 'dashed' ? [4, 4] : undefined

  if (edge.routing === 'orthogonal') {
    const segs = orthogonalSegments(p1, p2, edge.fromPort, edge.toPort)
    for (const [x1, y1, x2, y2] of segs) {
      if (x1 === x2 && y1 === y2) continue
      specs.push(tagSpec(
        { type: 'Line', left: 0, top: 0, width: 1, height: 1, x1, y1, x2, y2, stroke: '#888888', strokeWidth: 1.5, dashArray: dash, avnacDiagramEdgeId: edge.id },
        groupId, 'shape', edgeIndex,
      ))
    }
  } else {
    specs.push(tagSpec(
      { type: 'Line', left: 0, top: 0, width: 1, height: 1, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#888888', strokeWidth: 1.5, dashArray: dash, avnacDiagramEdgeId: edge.id },
      groupId, 'shape', edgeIndex,
    ))
  }

  // Arrowhead triangle at line tip
  if (edge.arrowEnd) {
    const tipX = p2.x, tipY = p2.y
    const segs = edge.routing === 'orthogonal'
      ? orthogonalSegments(p1, p2, edge.fromPort, edge.toPort).filter(([x1, y1, x2, y2]) => x1 !== x2 || y1 !== y2)
      : [[p1.x, p1.y, p2.x, p2.y] as [number, number, number, number]]
    const last = segs[segs.length - 1]
    const prevX = last?.[0] ?? p1.x
    const prevY = last?.[1] ?? p1.y
    const pts = arrowHeadPolygon(tipX, tipY, prevX, prevY)
    specs.push(tagSpec(
      { type: 'Polygon', left: 0, top: 0, width: 1, height: 1, fill: '#888888', strokeWidth: 0, points: pts, avnacDiagramEdgeId: edge.id },
      groupId, 'arrow-head', edgeIndex,
    ))
  }

  return specs
}

export function renderDiagram(data: AvnacDiagramData, groupId?: string): DiagramChildSpec[] {
  const { nodes, edges } = data
  const specs: DiagramChildSpec[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  // Draw edges first (under nodes)
  edges.forEach((edge, i) => {
    specs.push(...edgeSpecs(edge, nodeMap, groupId, i))
  })

  // Draw nodes
  nodes.forEach((node, i) => {
    specs.push(...nodeSpecs(node, groupId, i))
  })

  return specs
}

// Visible content bounds of all nodes, in diagram-local coordinates.
export function diagramContentBounds(data: AvnacDiagramData): { x: number; y: number; w: number; h: number } {
  if (data.nodes.length === 0) return { x: 0, y: 0, w: 400, h: 300 }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of data.nodes) {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + n.w)
    maxY = Math.max(maxY, n.y + n.h)
  }
  return {
    x: Number.isFinite(minX) ? minX : 0,
    y: Number.isFinite(minY) ? minY : 0,
    w: Number.isFinite(maxX - minX) ? maxX - minX : 400,
    h: Number.isFinite(maxY - minY) ? maxY - minY : 300,
  }
}

// Legacy bounding size from diagram-local origin.
export function diagramBounds(data: AvnacDiagramData): { w: number; h: number } {
  if (data.nodes.length === 0) return { w: 400, h: 300 }
  let maxX = 0, maxY = 0
  for (const n of data.nodes) {
    maxX = Math.max(maxX, n.x + n.w)
    maxY = Math.max(maxY, n.y + n.h)
  }
  return { w: maxX + 20, h: maxY + 20 }
}
