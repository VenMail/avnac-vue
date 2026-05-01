import { describe, expect, it } from 'vitest'
import type { AvnacDiagramData } from './avnac-diagram'
import { diagramBounds, diagramContentBounds } from './avnac-diagram-render'

describe('diagramContentBounds', () => {
  it('returns the visible node frame without preserving origin padding', () => {
    const diagram: AvnacDiagramData = {
      type: 'flowchart',
      nodes: [
        { id: 'a', type: 'process', label: 'A', x: 200, y: 20, w: 160, h: 50 },
        { id: 'b', type: 'decision', label: 'B', x: 80, y: 120, w: 120, h: 80 },
      ],
      edges: [],
    }

    expect(diagramContentBounds(diagram)).toEqual({ x: 80, y: 20, w: 280, h: 180 })
  })

  it('keeps the legacy origin-based size available for older callers', () => {
    const diagram: AvnacDiagramData = {
      type: 'flowchart',
      nodes: [
        { id: 'a', type: 'process', label: 'A', x: 200, y: 20, w: 160, h: 50 },
      ],
      edges: [],
    }

    expect(diagramBounds(diagram)).toEqual({ w: 380, h: 90 })
  })
})
