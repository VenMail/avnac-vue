// Maps OOXML schemeClr names → hex colors by parsing ppt/theme/theme1.xml

function q(el: Element | null | undefined, selector: string): Element | null {
  return el?.querySelector(selector) ?? null
}
function qs(el: Element | null | undefined, selector: string): Element[] {
  return el ? Array.from(el.querySelectorAll(selector)) : []
}

// Canonical schemeClr names used in OOXML
const SCHEME_CLR_NAMES = [
  'dk1', 'lt1', 'dk2', 'lt2',
  'acc1', 'acc2', 'acc3', 'acc4', 'acc5', 'acc6',
  'hlink', 'folHlink',
]

// Fallback palette when theme not available (Office default theme)
const OFFICE_DEFAULT_THEME: Record<string, string> = {
  dk1: '#000000',
  lt1: '#ffffff',
  dk2: '#44546a',
  lt2: '#e7e6e6',
  acc1: '#4472c4',
  acc2: '#ed7d31',
  acc3: '#a9d18e',
  acc4: '#ff0000',
  acc5: '#ffc000',
  acc6: '#70ad47',
  hlink: '#0563c1',
  folHlink: '#954f72',
}

function parseSrgbHex(el: Element | null): string | null {
  if (!el) return null
  const srgb = q(el, 'srgbClr')
  if (srgb) return '#' + (srgb.getAttribute('val') ?? '000000').toLowerCase()
  const sysClr = q(el, 'sysClr')
  if (sysClr) return '#' + (sysClr.getAttribute('lastClr') ?? '000000').toLowerCase()
  return null
}

export function resolveThemeColors(themeXml: string | null): Map<string, string> {
  const map = new Map<string, string>(Object.entries(OFFICE_DEFAULT_THEME))
  if (!themeXml) return map

  try {
    const doc = new DOMParser().parseFromString(themeXml, 'application/xml')
    const clrScheme = q(doc as unknown as Element, 'clrScheme')
    if (!clrScheme) return map

    for (const name of SCHEME_CLR_NAMES) {
      // Elements can be named directly (e.g. <a:dk1>) or with namespace prefix
      // DOMParser with application/xml uses namespace-aware parsing
      // Try querySelectorAll with local name fallback
      const candidates = qs(clrScheme, name)
      const el = candidates[0] ?? null
      const color = parseSrgbHex(el)
      if (color) map.set(name, color)
    }
  } catch {
    // Parse error — use defaults
  }

  return map
}

// Apply a luminance/saturation/tint/shade modification to a base hex color
// Returns modified hex string
export function applyColorMod(hex: string, modEl: Element | null): string {
  if (!modEl) return hex
  let r = parseInt(hex.slice(1, 3), 16)
  let g = parseInt(hex.slice(3, 5), 16)
  let b = parseInt(hex.slice(5, 7), 16)

  const lumMod = modEl.querySelector('lumMod')?.getAttribute('val')
  const lumOff = modEl.querySelector('lumOff')?.getAttribute('val')
  const shade = modEl.querySelector('shade')?.getAttribute('val')
  const tint = modEl.querySelector('tint')?.getAttribute('val')
  // alpha is ignored in hex output
  if (lumMod) {
    const factor = parseInt(lumMod, 10) / 100000
    r = Math.round(r * factor)
    g = Math.round(g * factor)
    b = Math.round(b * factor)
  }
  if (lumOff) {
    const off = Math.round((parseInt(lumOff, 10) / 100000) * 255)
    r += off; g += off; b += off
  }
  if (shade) {
    const factor = parseInt(shade, 10) / 100000
    r = Math.round(r * factor)
    g = Math.round(g * factor)
    b = Math.round(b * factor)
  }
  if (tint) {
    const factor = parseInt(tint, 10) / 100000
    r = Math.round(r + (255 - r) * (1 - factor))
    g = Math.round(g + (255 - g) * (1 - factor))
    b = Math.round(b + (255 - b) * (1 - factor))
  }

  const clamp = (v: number) => Math.max(0, Math.min(255, v))
  return '#' + [clamp(r), clamp(g), clamp(b)]
    .map(v => v.toString(16).padStart(2, '0'))
    .join('')
}

// Resolve a color element (solidFill child / rPr child / etc.) with theme awareness
export function resolveColorEl(
  el: Element | null,
  themeColors: Map<string, string>,
): string {
  if (!el) return '#000000'

  const srgb = el.querySelector('srgbClr')
  if (srgb) return '#' + (srgb.getAttribute('val') ?? '000000')

  const sysClr = el.querySelector('sysClr')
  if (sysClr) return '#' + (sysClr.getAttribute('lastClr') ?? '000000')

  const prstClr = el.querySelector('prstClr')
  if (prstClr) {
    const PRESET: Record<string, string> = {
      black: '#000000', white: '#ffffff', red: '#ff0000', green: '#00ff00',
      blue: '#0000ff', yellow: '#ffff00', cyan: '#00ffff', magenta: '#ff00ff',
      orange: '#ffa500', gray: '#808080', grey: '#808080', transparent: '#ffffff',
      darkBlue: '#00008b', darkCyan: '#008b8b', darkGray: '#a9a9a9',
      darkGreen: '#006400', darkMagenta: '#8b008b', darkRed: '#8b0000',
      darkYellow: '#808000', lightGray: '#d3d3d3', mediumBlue: '#0000cd',
    }
    return PRESET[prstClr.getAttribute('val') ?? ''] ?? '#000000'
  }

  const schemeClr = el.querySelector('schemeClr')
  if (schemeClr) {
    const val = schemeClr.getAttribute('val') ?? ''
    const base = themeColors.get(val) ?? '#888888'
    return applyColorMod(base, schemeClr)
  }

  return '#000000'
}
