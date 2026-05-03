import { describe, expect, it } from 'vitest'
import * as fabric from 'fabric'
import { createArrowGroup, getArrowParts, layoutArrowGroup } from './avnac-stroke-arrow'

describe('avnac stroke arrow heads', () => {
  it.each(['triangle', 'open', 'circle', 'diamond'] as const)('creates a %s line ending', (headType) => {
    const group = createArrowGroup(fabric, 0, 0, 240, 0, {
      strokeWidth: 8,
      headFrac: 1,
      headType,
      color: '#111827',
    })

    const parts = getArrowParts(group)
    expect(parts?.head?.visible).not.toBe(false)
    expect((parts?.head as any)?.avnacArrowHeadType).toBe(headType)
  })

  it('can switch an existing ending without losing the shaft', () => {
    const group = createArrowGroup(fabric, 0, 0, 240, 0, {
      strokeWidth: 8,
      headFrac: 1,
      headType: 'triangle',
      color: '#111827',
    })

    layoutArrowGroup(group, 0, 0, 240, 0, {
      strokeWidth: 8,
      headFrac: 1,
      headType: 'circle',
      color: '#111827',
    })

    const parts = getArrowParts(group)
    expect(parts?.shaft).toBeTruthy()
    expect((parts?.head as any)?.avnacArrowHeadType).toBe('circle')

    layoutArrowGroup(group, 0, 0, 240, 0, {
      strokeWidth: 8,
      headFrac: 0,
      headType: 'none',
      color: '#111827',
    })

    expect(getArrowParts(group)?.head?.visible).toBe(false)
  })
})
