import type { BgValue } from './bg-value'

export type DiagramNodeType = 'process' | 'decision' | 'terminal' | 'io' | 'org-node'

export interface DiagramNode {
  id: string
  type: DiagramNodeType
  label: string
  x: number  // artboard px, relative to diagram group origin
  y: number
  w: number
  h: number
  fill?: BgValue
}

export interface DiagramEdge {
  id: string
  fromId: string
  fromPort: 'top' | 'right' | 'bottom' | 'left'
  toId: string
  toPort: 'top' | 'right' | 'bottom' | 'left'
  label?: string
  style: 'solid' | 'dashed'
  arrowEnd: boolean
  routing?: 'straight' | 'orthogonal'
}

export interface AvnacDiagramData {
  type: 'flowchart' | 'organogram'
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

let _id = 0
function uid() { return `d${++_id}-${Date.now().toString(36)}` }

export function defaultFlowchart(): AvnacDiagramData {
  const start = uid(), proc = uid(), end = uid()
  return {
    type: 'flowchart',
    nodes: [
      { id: start, type: 'terminal', label: 'Start', x: 200, y: 20, w: 160, h: 50, fill: { type: 'solid', color: '#4472c4' } },
      { id: proc, type: 'process', label: 'Process', x: 200, y: 120, w: 160, h: 50, fill: { type: 'solid', color: '#ed7d31' } },
      { id: end, type: 'terminal', label: 'End', x: 200, y: 220, w: 160, h: 50, fill: { type: 'solid', color: '#4472c4' } },
    ],
    edges: [
      { id: uid(), fromId: start, fromPort: 'bottom', toId: proc, toPort: 'top', style: 'solid', arrowEnd: true },
      { id: uid(), fromId: proc, fromPort: 'bottom', toId: end, toPort: 'top', style: 'solid', arrowEnd: true },
    ],
  }
}

export function defaultOrganogram(): AvnacDiagramData {
  const ceo = uid(), vp1 = uid(), vp2 = uid(), dir1 = uid(), dir2 = uid()
  return {
    type: 'organogram',
    nodes: [
      { id: ceo, type: 'org-node', label: 'CEO', x: 200, y: 20, w: 160, h: 50, fill: { type: 'solid', color: '#4472c4' } },
      { id: vp1, type: 'org-node', label: 'VP Engineering', x: 60, y: 120, w: 160, h: 50, fill: { type: 'solid', color: '#70ad47' } },
      { id: vp2, type: 'org-node', label: 'VP Marketing', x: 340, y: 120, w: 160, h: 50, fill: { type: 'solid', color: '#70ad47' } },
      { id: dir1, type: 'org-node', label: 'Director', x: 60, y: 220, w: 160, h: 50, fill: { type: 'solid', color: '#a9d18e' } },
      { id: dir2, type: 'org-node', label: 'Director', x: 340, y: 220, w: 160, h: 50, fill: { type: 'solid', color: '#a9d18e' } },
    ],
    edges: [
      { id: uid(), fromId: ceo, fromPort: 'bottom', toId: vp1, toPort: 'top', style: 'solid', arrowEnd: false },
      { id: uid(), fromId: ceo, fromPort: 'bottom', toId: vp2, toPort: 'top', style: 'solid', arrowEnd: false },
      { id: uid(), fromId: vp1, fromPort: 'bottom', toId: dir1, toPort: 'top', style: 'solid', arrowEnd: false },
      { id: uid(), fromId: vp2, fromPort: 'bottom', toId: dir2, toPort: 'top', style: 'solid', arrowEnd: false },
    ],
  }
}
