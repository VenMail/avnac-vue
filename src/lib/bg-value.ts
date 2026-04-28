export type GradientStop = { color: string; offset: number }

export type BgValue =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; css: string; stops: GradientStop[]; angle: number }

export function isTransparentCssColor(value: string): boolean {
  const v = value.trim().toLowerCase()
  if (v === 'transparent' || v === 'rgba(0,0,0,0)' || v === 'rgba(0, 0, 0, 0)') return true
  if (v.startsWith('#') && v.length === 9) {
    return v.slice(7) === '00'
  }
  if (v.startsWith('#') && v.length === 5) {
    return v.slice(4) === '0'
  }
  const rgba = v.match(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/)
  return rgba != null
}

export function solidPaintColorsEquivalent(a: string, b: string): boolean {
  if (isTransparentCssColor(a) && isTransparentCssColor(b)) return true
  return a.toLowerCase() === b.toLowerCase()
}

export function bgValueToCss(v: BgValue): string {
  return v.type === 'solid' ? v.color : v.css
}

export function bgValueToSwatch(v: BgValue): { background: string } {
  if (v.type === 'solid' && isTransparentCssColor(v.color)) {
    return {
      background:
        'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px',
    }
  }
  return { background: bgValueToCss(v) }
}
