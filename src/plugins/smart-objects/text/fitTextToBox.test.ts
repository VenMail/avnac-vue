import { describe, expect, it } from 'vitest'
import { fitTextToBox } from './fitTextToBox'

describe('fitTextToBox', () => {
  it('keeps fitted text within the requested font limits', () => {
    const result = fitTextToBox({
      text: 'A concise label',
      width: 140,
      height: 28,
      minFontSize: 8,
      maxFontSize: 24,
      padding: 2,
    })

    expect(result.fontSize).toBeGreaterThanOrEqual(8)
    expect(result.fontSize).toBeLessThanOrEqual(24)
    expect(result.lineHeight).toBe(1.12)
  })

  it('shrinks long labels compared with short labels in the same box', () => {
    const short = fitTextToBox({
      text: 'CEO',
      width: 96,
      height: 24,
      minFontSize: 6,
      maxFontSize: 22,
    })
    const long = fitTextToBox({
      text: 'Vice President of Engineering Operations',
      width: 96,
      height: 24,
      minFontSize: 6,
      maxFontSize: 22,
    })

    expect(long.fontSize).toBeLessThan(short.fontSize)
  })
})
