import type { BgValue, GradientStop } from '#/lib/bg-value'

export interface PptxFill {
  type: 'solid' | 'gradient' | 'none'
  color?: string
  stops?: Array<{ color: string; position: number }>
  angle?: number
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) return clean.toUpperCase()
  return '000000'
}

export function bgValueToPptxFill(v: BgValue): PptxFill {
  if (v.type === 'solid') {
    if (v.color === 'transparent' || v.color === 'rgba(0,0,0,0)') {
      return { type: 'none' }
    }
    return { type: 'solid', color: hexToRgb(v.color) }
  }
  // gradient
  const stops = v.stops.map((s: GradientStop) => ({
    color: hexToRgb(s.color),
    position: Math.round(s.offset * 100),
  }))
  return { type: 'gradient', stops, angle: v.angle ?? 135 }
}

export function pptxFillToSpec(fill: PptxFill): object {
  if (fill.type === 'none') return { type: 'none' }
  if (fill.type === 'solid') return { type: 'solid', color: fill.color }
  if (fill.type === 'gradient' && fill.stops) {
    return {
      type: 'linear',
      angle: fill.angle ?? 135,
      stops: fill.stops.map((s) => ({ color: s.color, position: s.position + '%' })),
    }
  }
  return { type: 'none' }
}
