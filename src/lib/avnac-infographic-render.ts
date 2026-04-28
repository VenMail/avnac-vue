// Fabric.js group generators for infographic templates
// Each function returns a plain object spec array — actual Fabric objects created by canvas
import type { AvnacInfographicData } from './avnac-infographic'

export interface InfographicChildSpec {
  type: 'Rect' | 'Polygon' | 'Ellipse' | 'Textbox' | 'Line' | 'Circle'
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
  radius?: number
  text?: string
  fontSize?: number
  fontWeight?: string
  textAlign?: string
  originX?: string
  originY?: string
  selectable?: boolean
  evented?: boolean
}

function colorAt(scheme: string[], i: number): string {
  return scheme[i % scheme.length] ?? '#4472c4'
}

export function renderPyramid(data: AvnacInfographicData): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const tierH = height / n

  for (let i = 0; i < n; i++) {
    // tier 0 = apex (top), tier n-1 = base (bottom)
    const widthFraction = (i + 1) / n
    const w = width * widthFraction
    const x = (width - w) / 2
    const y = i * tierH
    const color = colorAt(colorScheme, i)

    // Trapezoid: top edge narrower than bottom by one tier step
    const topW = width * (i / n)
    const topX = (width - topW) / 2
    const points = [
      { x: topX, y },
      { x: topX + topW, y },
      { x: x + w, y: y + tierH },
      { x, y: y + tierH },
    ]
    specs.push({ type: 'Polygon', left: 0, top: 0, width, height, fill: color, strokeWidth: 0, points })

    if (data.options.showLabels) {
      specs.push({
        type: 'Textbox', left: width / 2 - 120, top: y + tierH / 2 - 12,
        width: 240, height: 24, text: items[i].label,
        fontSize: 13, fontWeight: 'bold', textAlign: 'center', fill: '#ffffff',
      })
    }
    if (data.options.showValues && items[i].value) {
      specs.push({
        type: 'Textbox', left: width / 2 - 60, top: y + tierH / 2 + 10,
        width: 120, height: 18, text: items[i].value!,
        fontSize: 11, textAlign: 'center', fill: '#ffffff',
      })
    }
  }
  return specs
}

export function renderFunnel(data: AvnacInfographicData): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const tierH = height / n

  for (let i = 0; i < n; i++) {
    // funnel: top widest, narrowing downward
    const topFraction = (n - i) / n
    const botFraction = (n - i - 1) / n
    const topW = width * topFraction
    const botW = width * botFraction
    const topX = (width - topW) / 2
    const botX = (width - botW) / 2
    const y = i * tierH
    const color = colorAt(colorScheme, i)

    const points = [
      { x: topX, y },
      { x: topX + topW, y },
      { x: botX + botW, y: y + tierH },
      { x: botX, y: y + tierH },
    ]
    specs.push({ type: 'Polygon', left: 0, top: 0, width, height, fill: color, strokeWidth: 0, points })

    if (data.options.showLabels) {
      specs.push({
        type: 'Textbox', left: width / 2 - 120, top: y + tierH / 2 - 10,
        width: 240, height: 22, text: items[i].label,
        fontSize: 13, fontWeight: 'bold', textAlign: 'center', fill: '#ffffff',
      })
    }
  }
  return specs
}

export function renderTimelineH(data: AvnacInfographicData): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const midY = height / 2
  const step = width / (n + 1)

  // Horizontal line
  specs.push({ type: 'Rect', left: step * 0.5, top: midY - 1, width: step * n, height: 2, fill: '#cccccc', strokeWidth: 0 })

  for (let i = 0; i < n; i++) {
    const cx = step * (i + 1)
    const color = colorAt(colorScheme, i)

    // Circle marker
    specs.push({ type: 'Circle', left: cx - 12, top: midY - 12, width: 24, height: 24, radius: 12, fill: color, strokeWidth: 0 })

    // Label above
    if (data.options.showLabels) {
      specs.push({
        type: 'Textbox', left: cx - 60, top: midY - 50, width: 120, height: 30,
        text: items[i].label, fontSize: 11, fontWeight: 'bold', textAlign: 'center', fill: '#262626',
      })
    }
    // Sublabel below
    if (items[i].sublabel) {
      specs.push({
        type: 'Textbox', left: cx - 60, top: midY + 20, width: 120, height: 30,
        text: items[i].sublabel!, fontSize: 10, textAlign: 'center', fill: '#666666',
      })
    }
    // Value inside circle
    if (data.options.showValues && items[i].value) {
      specs.push({
        type: 'Textbox', left: cx - 12, top: midY - 9, width: 24, height: 18,
        text: items[i].value!, fontSize: 10, fontWeight: 'bold', textAlign: 'center', fill: '#ffffff',
      })
    }
  }
  return specs
}

export function renderTimelineV(data: AvnacInfographicData): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const midX = width * 0.35
  const step = height / (n + 1)

  // Vertical line
  specs.push({ type: 'Rect', left: midX - 1, top: step * 0.5, width: 2, height: step * n, fill: '#cccccc', strokeWidth: 0 })

  for (let i = 0; i < n; i++) {
    const cy = step * (i + 1)
    const color = colorAt(colorScheme, i)

    specs.push({ type: 'Circle', left: midX - 12, top: cy - 12, width: 24, height: 24, radius: 12, fill: color, strokeWidth: 0 })

    if (data.options.showLabels) {
      specs.push({
        type: 'Textbox', left: midX + 20, top: cy - 14, width: width - midX - 24, height: 18,
        text: items[i].label, fontSize: 12, fontWeight: 'bold', fill: '#262626',
      })
    }
    if (items[i].sublabel) {
      specs.push({
        type: 'Textbox', left: midX + 20, top: cy + 6, width: width - midX - 24, height: 18,
        text: items[i].sublabel!, fontSize: 10, fill: '#666666',
      })
    }
  }
  return specs
}

export function renderChevron(data: AvnacInfographicData): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const itemW = width / n
  const notch = height * 0.25

  for (let i = 0; i < n; i++) {
    const x = i * itemW
    const color = colorAt(colorScheme, i)
    const isLast = i === n - 1

    const points = isLast
      ? [{ x }, { x: x + itemW, y: 0 }, { x: x + itemW, y: height }, { x, y: height }, { x: x + notch, y: height / 2 }].map(p => ({ x: p.x, y: p.y ?? 0 }))
      : [
          { x, y: 0 }, { x: x + itemW - notch, y: 0 }, { x: x + itemW, y: height / 2 },
          { x: x + itemW - notch, y: height }, { x, y: height }, { x: x + notch, y: height / 2 },
        ]
    specs.push({ type: 'Polygon', left: 0, top: 0, width, height, fill: color, stroke: '#ffffff', strokeWidth: 2, points })

    if (data.options.showLabels) {
      specs.push({
        type: 'Textbox', left: x + 4, top: height / 2 - 12, width: itemW - 8, height: 24,
        text: items[i].label, fontSize: 11, fontWeight: 'bold', textAlign: 'center', fill: '#ffffff',
      })
    }
  }
  return specs
}

export function renderCycle(data: AvnacInfographicData): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const cx = width / 2, cy = height / 2
  const r = Math.min(cx, cy) * 0.75
  const nodeR = Math.min(width, height) * 0.14

  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n
    const nx = cx + r * Math.cos(angle)
    const ny = cy + r * Math.sin(angle)
    const color = colorAt(colorScheme, i)

    specs.push({ type: 'Circle', left: nx - nodeR, top: ny - nodeR, width: nodeR * 2, height: nodeR * 2, radius: nodeR, fill: color, strokeWidth: 0 })

    if (data.options.showLabels) {
      specs.push({
        type: 'Textbox', left: nx - nodeR - 10, top: ny - 10, width: (nodeR + 10) * 2, height: 20,
        text: items[i].label, fontSize: 11, fontWeight: 'bold', textAlign: 'center', fill: '#ffffff',
      })
    }
  }
  return specs
}

export function renderVenn(data: AvnacInfographicData): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = Math.min(items.length, 3)
  const specs: InfographicChildSpec[] = []
  const r = Math.min(width, height) * 0.38
  const cx = width / 2, cy = height / 2
  const offset = r * 0.55

  const positions = n === 2
    ? [{ x: cx - offset, y: cy }, { x: cx + offset, y: cy }]
    : [{ x: cx, y: cy - offset * 0.8 }, { x: cx - offset, y: cy + offset * 0.4 }, { x: cx + offset, y: cy + offset * 0.4 }]

  for (let i = 0; i < n; i++) {
    const { x, y } = positions[i]
    const color = colorAt(colorScheme, i)
    specs.push({
      type: 'Ellipse', left: x - r, top: y - r, width: r * 2, height: r * 2,
      rx: r, ry: r,
      fill: color + '99', stroke: color, strokeWidth: 1,
    })
    if (data.options.showLabels && items[i]) {
      specs.push({
        type: 'Textbox', left: x - 50, top: y - r * 0.5, width: 100, height: 20,
        text: items[i].label, fontSize: 11, fontWeight: 'bold', textAlign: 'center', fill: '#262626',
      })
    }
  }
  return specs
}

export function renderAccordion(data: AvnacInfographicData): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const rowH = height / n
  const headerW = width * 0.85

  for (let i = 0; i < n; i++) {
    const y = i * rowH
    const color = colorAt(colorScheme, i)

    // Header bar
    specs.push({ type: 'Rect', left: 0, top: y, width: headerW, height: rowH - 3, fill: color, rx: 4, ry: 4, strokeWidth: 0 })

    // Step number
    specs.push({ type: 'Rect', left: 0, top: y, width: rowH - 3, height: rowH - 3, fill: 'rgba(0,0,0,0.15)', rx: 4, ry: 4, strokeWidth: 0 })
    specs.push({
      type: 'Textbox', left: 0, top: y + rowH / 2 - 10, width: rowH - 3, height: 20,
      text: String(i + 1), fontSize: 13, fontWeight: 'bold', textAlign: 'center', fill: '#ffffff',
    })

    // Label
    if (data.options.showLabels) {
      specs.push({
        type: 'Textbox', left: rowH, top: y + rowH / 2 - 10, width: headerW - rowH - 8, height: 20,
        text: items[i].label, fontSize: 12, fontWeight: 'bold', fill: '#ffffff',
      })
    }
    if (items[i].sublabel) {
      specs.push({
        type: 'Textbox', left: headerW + 6, top: y + rowH / 2 - 10, width: width - headerW - 6, height: 20,
        text: items[i].sublabel!, fontSize: 11, fill: '#666666',
      })
    }
  }
  return specs
}

export function renderMatrix2x2(data: AvnacInfographicData): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const specs: InfographicChildSpec[] = []
  const hw = width / 2, hh = height / 2
  const positions = [
    { x: 0, y: 0 }, { x: hw, y: 0 },
    { x: 0, y: hh }, { x: hw, y: hh },
  ]

  for (let i = 0; i < 4; i++) {
    const { x, y } = positions[i]
    const item = items[i] ?? { label: '' }
    const color = colorAt(colorScheme, i)
    specs.push({ type: 'Rect', left: x + 2, top: y + 2, width: hw - 4, height: hh - 4, fill: color + '44', stroke: color, strokeWidth: 1, rx: 4, ry: 4 })
    if (data.options.showLabels) {
      specs.push({
        type: 'Textbox', left: x + 8, top: y + 10, width: hw - 16, height: 20,
        text: item.label, fontSize: 13, fontWeight: 'bold', textAlign: 'center', fill: '#262626',
      })
    }
    if (item.sublabel) {
      specs.push({
        type: 'Textbox', left: x + 8, top: y + 32, width: hw - 16, height: 36,
        text: item.sublabel, fontSize: 10, textAlign: 'center', fill: '#666666',
      })
    }
  }

  // Divider lines
  specs.push({ type: 'Rect', left: hw - 1, top: 0, width: 2, height, fill: '#dddddd', strokeWidth: 0 })
  specs.push({ type: 'Rect', left: 0, top: hh - 1, width, height: 2, fill: '#dddddd', strokeWidth: 0 })

  return specs
}

export type InfographicRenderFn = (data: AvnacInfographicData) => InfographicChildSpec[]

export const INFOGRAPHIC_RENDERERS: Record<string, InfographicRenderFn> = {
  pyramid: renderPyramid,
  funnel: renderFunnel,
  'timeline-h': renderTimelineH,
  'timeline-v': renderTimelineV,
  chevron: renderChevron,
  cycle: renderCycle,
  venn: renderVenn,
  accordion: renderAccordion,
  'matrix-2x2': renderMatrix2x2,
}

export function renderInfographic(data: AvnacInfographicData): InfographicChildSpec[] {
  const fn = INFOGRAPHIC_RENDERERS[data.template]
  return fn ? fn(data) : []
}
