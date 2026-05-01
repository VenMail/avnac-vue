import { describe, expect, it } from 'vitest'
import type { AvnacSmartObjectData } from '../types'
import { syncSmartTextObjectToSource } from './fabricObjectFactory'

function fakeCanvas(objects: unknown[]) {
  return {
    getObjects: () => objects,
  } as never
}

describe('syncSmartTextObjectToSource', () => {
  it('writes diagram label edits back to the smart object source', () => {
    const data: AvnacSmartObjectData = {
      id: 'smart-1',
      kind: 'flowchart',
      template: 'flowchart',
      version: 1,
      bounds: { x: 0, y: 0, width: 200, height: 120 },
      source: {
        type: 'flowchart',
        nodes: [
          { id: 'node-1', type: 'process', label: 'Old', x: 0, y: 0, w: 100, h: 40 },
        ],
        edges: [],
      },
    }
    const label = {
      avnacSmartObjectId: 'smart-1',
      avnacSmartObjectData: data,
      avnacSmartObjectRole: 'label',
      avnacSmartNodeId: 'node-1',
      text: 'New',
      fontSize: 18,
    }

    const next = syncSmartTextObjectToSource(fakeCanvas([label]), label as never)

    expect(next?.source).toMatchObject({
      nodes: [{ id: 'node-1', label: 'New', fontSize: 9 }],
    })
    expect(label.avnacSmartObjectData.source).toMatchObject({
      nodes: [{ id: 'node-1', label: 'New', fontSize: 9 }],
    })
  })

  it('writes infographic value edits back to the matching item', () => {
    const data: AvnacSmartObjectData = {
      id: 'smart-2',
      kind: 'infographic',
      template: 'pyramid',
      version: 1,
      bounds: { x: 0, y: 0, width: 200, height: 120 },
      source: {
        template: 'pyramid',
        items: [
          { label: 'A', value: '10%' },
          { label: 'B', value: '20%' },
        ],
        options: {
          width: 200,
          height: 120,
          colorScheme: ['#4472c4'],
          showLabels: true,
          showValues: true,
        },
      },
    }
    const value = {
      avnacSmartObjectId: 'smart-2',
      avnacSmartObjectData: data,
      avnacSmartObjectRole: 'value',
      avnacSmartItemIndex: 1,
      text: '45%',
      fontSize: 16,
    }

    const next = syncSmartTextObjectToSource(fakeCanvas([value]), value as never)

    expect(next?.source).toMatchObject({
      items: [
        { label: 'A', value: '10%' },
        { label: 'B', value: '45%' },
      ],
    })
  })

  it('writes infographic label font-size edits back to the matching item', () => {
    const data: AvnacSmartObjectData = {
      id: 'smart-3',
      kind: 'infographic',
      template: 'pyramid',
      version: 1,
      bounds: { x: 0, y: 0, width: 200, height: 120 },
      source: {
        template: 'pyramid',
        items: [{ label: 'A' }, { label: 'B' }],
        options: {
          width: 200,
          height: 120,
          colorScheme: ['#4472c4'],
          showLabels: true,
          showValues: true,
        },
      },
    }
    const label = {
      avnacSmartObjectId: 'smart-3',
      avnacSmartObjectData: data,
      avnacSmartObjectRole: 'label',
      avnacSmartItemIndex: 0,
      text: 'A',
      fontSize: 22,
    }

    const next = syncSmartTextObjectToSource(fakeCanvas([label]), label as never)

    expect(next?.source).toMatchObject({
      items: [{ label: 'A', fontSize: 22 }, { label: 'B' }],
    })
  })
})
