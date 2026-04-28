import type { BgValue } from '#/lib/bg-value'

type GradientStop = { color: string; offset: number }

function q(el: Element | null | undefined, selector: string): Element | null {
  return el?.querySelector(selector) ?? null
}
function qs(el: Element | null | undefined, selector: string): Element[] {
  return el ? Array.from(el.querySelectorAll(selector)) : []
}

function parseSrgbColor(el: Element | null): string | null {
  if (!el) return null
  const srgb = q(el, 'srgbClr')
  if (srgb) return '#' + (srgb.getAttribute('val') ?? '000000')
  const sysClr = q(el, 'sysClr')
  if (sysClr) return '#' + (sysClr.getAttribute('lastClr') ?? '000000')
  return null
}


// Apply luminance modification (lumMod/lumOff) to a hex color
function applyLumMod(hex: string, lumMod?: number, lumOff?: number): string {
  // Simple lightness shift — convert hex → RGB → approximate HSL shift
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mod = lumMod !== undefined ? lumMod / 100000 : 1
  const off = lumOff !== undefined ? lumOff / 100000 : 0
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const nr = clamp(r * mod + off * 255)
  const ng = clamp(g * mod + off * 255)
  const nb = clamp(b * mod + off * 255)
  return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('')
}

export function parseOoxmlGradient(
  gradFill: Element,
  themeColors: Map<string, string> = new Map(),
): BgValue {
  const gsLst = q(gradFill, 'gsLst')
  const stops = qs(gsLst, 'gs')
  const lin = q(gradFill, 'lin')

  // Parse angle from linear gradient element (in 60000ths of a degree, clockwise from top)
  let angle = 90 // default: top → bottom
  if (lin) {
    const rawAng = lin.getAttribute('ang')
    if (rawAng) {
      // OOXML angle: 0 = right, increases clockwise. 5400000 = down, 10800000 = left
      // CSS angle: 0deg = up, increases clockwise. 90deg = right.
      // Convert: cssAngle = (ooxmlAngle / 60000 - 90 + 360) % 360
      const ooxmlDeg = parseInt(rawAng, 10) / 60000
      angle = Math.round((ooxmlDeg - 90 + 360) % 360)
    }
  }

  const parsedStops: GradientStop[] = stops.map(gs => {
    const pos = parseInt(gs.getAttribute('pos') ?? '0', 10) / 100000 // 0..1
    const schemeClr = q(gs, 'schemeClr')
    let color = parseSrgbColor(gs) ?? '#888888'
    if (!parseSrgbColor(gs) && schemeClr) {
      const val = schemeClr.getAttribute('val') ?? ''
      const base = themeColors.get(val) ?? '#888888'
      const lumMod = q(schemeClr, 'lumMod')?.getAttribute('val')
      const lumOff = q(schemeClr, 'lumOff')?.getAttribute('val')
      color = applyLumMod(
        base,
        lumMod ? parseInt(lumMod, 10) : undefined,
        lumOff ? parseInt(lumOff, 10) : undefined,
      )
    }
    return { color, offset: pos }
  })

  if (parsedStops.length < 2) {
    // Not enough stops — return solid with first stop color
    return { type: 'solid', color: parsedStops[0]?.color ?? '#888888' }
  }

  // Build CSS gradient string for preview
  const stopCss = parsedStops
    .map(s => `${s.color} ${Math.round(s.offset * 100)}%`)
    .join(', ')
  const css = `linear-gradient(${angle}deg, ${stopCss})`

  return {
    type: 'gradient',
    css,
    stops: parsedStops,
    angle,
  } as unknown as BgValue
}
