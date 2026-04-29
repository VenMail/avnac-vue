// Flat Fabric object spec generators for infographic templates.
// All text widths derive from enclosing shape geometry — never hardcoded constants.
// Each spec carries group-tag fields so the insertion path can tag Fabric objects.
import type { AvnacInfographicData } from './avnac-infographic'
import type { AvnacGroupRole } from './avnac-shape-meta'

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
  // Logical-group membership — set by render functions when groupId provided
  avnacGroupId?: string
  avnacGroupKind?: string
  avnacGroupRole?: AvnacGroupRole
  avnacGroupItemIndex?: number
}

function colorAt(scheme: string[], i: number): string {
  return scheme[i % scheme.length] ?? '#4472c4'
}

function tag(
  spec: InfographicChildSpec,
  groupId: string | undefined,
  role: AvnacGroupRole,
  itemIndex: number,
): InfographicChildSpec {
  if (!groupId) return spec
  return { ...spec, avnacGroupId: groupId, avnacGroupKind: 'infographic', avnacGroupRole: role, avnacGroupItemIndex: itemIndex }
}

export function renderPyramid(data: AvnacInfographicData, groupId?: string): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const tierH = height / n
  const padX = 12

  for (let i = 0; i < n; i++) {
    const widthFraction = (i + 1) / n
    const w = width * widthFraction
    const x = (width - w) / 2
    const y = i * tierH
    const color = items[i].color ?? colorAt(colorScheme, i)

    const topW = width * (i / n)
    const topX = (width - topW) / 2
    const points = [
      { x: topX, y },
      { x: topX + topW, y },
      { x: x + w, y: y + tierH },
      { x, y: y + tierH },
    ]
    specs.push(tag(
      { type: 'Polygon', left: 0, top: 0, width, height, fill: color, strokeWidth: 0, points },
      groupId, 'shape', i,
    ))

    // Text width = mid-width of this tier minus padding
    const midW = (topW + w) / 2
    const tbW = Math.max(40, midW - padX * 2)
    const tbLeft = (width - tbW) / 2

    if (data.options.showLabels) {
      const hasSub = !!items[i].sublabel && data.options.showValues
      const lblTop = y + tierH / 2 - (hasSub ? 13 : 8)
      specs.push(tag(
        {
          type: 'Textbox', left: tbLeft, top: lblTop, width: tbW, height: 18,
          text: items[i].label,
          fontSize: items[i].fontSize ?? 12, fontWeight: items[i].fontWeight ?? 'bold',
          textAlign: items[i].align ?? 'center', fill: '#ffffff',
        },
        groupId, 'label', i,
      ))
    }
    if (data.options.showValues && items[i].value) {
      specs.push(tag(
        {
          type: 'Textbox', left: tbLeft, top: y + tierH / 2 + 6, width: tbW, height: 16,
          text: items[i].value!,
          fontSize: 10, textAlign: 'center', fill: 'rgba(255,255,255,0.85)',
        },
        groupId, 'value', i,
      ))
    }
  }
  return specs
}

export function renderFunnel(data: AvnacInfographicData, groupId?: string): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const tierH = height / n
  const padX = 12

  for (let i = 0; i < n; i++) {
    const topFraction = (n - i) / n
    const botFraction = (n - i - 1) / n
    const topW = width * topFraction
    const botW = width * botFraction
    const topX = (width - topW) / 2
    const botX = (width - botW) / 2
    const y = i * tierH
    const color = items[i].color ?? colorAt(colorScheme, i)

    const points = [
      { x: topX, y },
      { x: topX + topW, y },
      { x: botX + botW, y: y + tierH },
      { x: botX, y: y + tierH },
    ]
    specs.push(tag(
      { type: 'Polygon', left: 0, top: 0, width, height, fill: color, strokeWidth: 0, points },
      groupId, 'shape', i,
    ))

    const midW = (topW + botW) / 2
    const tbW = Math.max(40, midW - padX * 2)
    const tbLeft = (width - tbW) / 2
    const hasSub = !!items[i].sublabel

    if (data.options.showLabels) {
      specs.push(tag(
        {
          type: 'Textbox', left: tbLeft, top: y + tierH / 2 - (hasSub ? 13 : 8),
          width: tbW, height: 18,
          text: items[i].label,
          fontSize: items[i].fontSize ?? 12, fontWeight: items[i].fontWeight ?? 'bold',
          textAlign: items[i].align ?? 'center', fill: '#ffffff',
        },
        groupId, 'label', i,
      ))
    }
    if (hasSub) {
      specs.push(tag(
        {
          type: 'Textbox', left: tbLeft, top: y + tierH / 2 + 6, width: tbW, height: 16,
          text: items[i].sublabel!,
          fontSize: 10, textAlign: 'center', fill: 'rgba(255,255,255,0.8)',
        },
        groupId, 'sublabel', i,
      ))
    }
  }
  return specs
}

export function renderTimelineH(data: AvnacInfographicData, groupId?: string): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const midY = height / 2
  const step = width / (n + 1)
  const pitch = step  // section pitch

  specs.push(tag(
    { type: 'Rect', left: step * 0.5, top: midY - 1, width: step * n, height: 2, fill: '#cccccc', strokeWidth: 0 },
    groupId, 'decoration', -1,
  ))

  for (let i = 0; i < n; i++) {
    const cx = step * (i + 1)
    const color = items[i].color ?? colorAt(colorScheme, i)
    const tbW = Math.max(60, pitch - 8)
    const tbLeft = cx - tbW / 2

    specs.push(tag(
      { type: 'Circle', left: cx - 12, top: midY - 12, width: 24, height: 24, radius: 12, fill: color, strokeWidth: 0 },
      groupId, 'shape', i,
    ))

    if (data.options.showLabels) {
      specs.push(tag(
        {
          type: 'Textbox', left: tbLeft, top: midY - 50, width: tbW, height: 30,
          text: items[i].label,
          fontSize: items[i].fontSize ?? 11, fontWeight: items[i].fontWeight ?? 'bold',
          textAlign: items[i].align ?? 'center', fill: '#262626',
        },
        groupId, 'label', i,
      ))
    }
    if (items[i].sublabel) {
      specs.push(tag(
        {
          type: 'Textbox', left: tbLeft, top: midY + 20, width: tbW, height: 30,
          text: items[i].sublabel!,
          fontSize: 10, textAlign: 'center', fill: '#666666',
        },
        groupId, 'sublabel', i,
      ))
    }
    if (data.options.showValues && items[i].value) {
      specs.push(tag(
        {
          type: 'Textbox', left: cx - 12, top: midY - 9, width: 24, height: 18,
          text: items[i].value!,
          fontSize: 10, fontWeight: 'bold', textAlign: 'center', fill: '#ffffff',
        },
        groupId, 'value', i,
      ))
    }
  }
  return specs
}

export function renderTimelineV(data: AvnacInfographicData, groupId?: string): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const midX = width * 0.35
  const step = height / (n + 1)

  specs.push(tag(
    { type: 'Rect', left: midX - 1, top: step * 0.5, width: 2, height: step * n, fill: '#cccccc', strokeWidth: 0 },
    groupId, 'decoration', -1,
  ))

  for (let i = 0; i < n; i++) {
    const cy = step * (i + 1)
    const color = items[i].color ?? colorAt(colorScheme, i)
    const tbW = Math.max(80, width - midX - 24)

    specs.push(tag(
      { type: 'Circle', left: midX - 12, top: cy - 12, width: 24, height: 24, radius: 12, fill: color, strokeWidth: 0 },
      groupId, 'shape', i,
    ))

    if (data.options.showLabels) {
      specs.push(tag(
        {
          type: 'Textbox', left: midX + 20, top: cy - 14, width: tbW, height: 18,
          text: items[i].label,
          fontSize: items[i].fontSize ?? 12, fontWeight: items[i].fontWeight ?? 'bold',
          fill: '#262626',
        },
        groupId, 'label', i,
      ))
    }
    if (items[i].sublabel) {
      specs.push(tag(
        {
          type: 'Textbox', left: midX + 20, top: cy + 6, width: tbW, height: 18,
          text: items[i].sublabel!,
          fontSize: 10, fill: '#666666',
        },
        groupId, 'sublabel', i,
      ))
    }
  }
  return specs
}

export function renderChevron(data: AvnacInfographicData, groupId?: string): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const itemW = width / n
  const notch = height * 0.25

  for (let i = 0; i < n; i++) {
    const x = i * itemW
    const color = items[i].color ?? colorAt(colorScheme, i)
    const isLast = i === n - 1

    const points = isLast
      ? [{ x }, { x: x + itemW, y: 0 }, { x: x + itemW, y: height }, { x, y: height }, { x: x + notch, y: height / 2 }].map(p => ({ x: p.x, y: p.y ?? 0 }))
      : [
          { x, y: 0 }, { x: x + itemW - notch, y: 0 }, { x: x + itemW, y: height / 2 },
          { x: x + itemW - notch, y: height }, { x, y: height }, { x: x + notch, y: height / 2 },
        ]
    specs.push(tag(
      { type: 'Polygon', left: 0, top: 0, width, height, fill: color, stroke: '#ffffff', strokeWidth: 2, points },
      groupId, 'shape', i,
    ))

    // Text starts AFTER the left notch and ends BEFORE the right tip notch
    // (or right edge for the last chevron, which has no right notch).
    const tbLeft = x + notch + 4
    const tbRight = isLast ? x + itemW - 4 : x + itemW - notch - 4
    const tbW = Math.max(20, tbRight - tbLeft)
    if (data.options.showLabels) {
      specs.push(tag(
        {
          type: 'Textbox', left: tbLeft, top: height / 2 - 12, width: tbW, height: 24,
          text: items[i].label,
          fontSize: items[i].fontSize ?? 11, fontWeight: items[i].fontWeight ?? 'bold',
          textAlign: items[i].align ?? 'center', fill: '#ffffff',
        },
        groupId, 'label', i,
      ))
    }
  }
  return specs
}

export function renderCycle(data: AvnacInfographicData, groupId?: string): InfographicChildSpec[] {
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
    const color = items[i].color ?? colorAt(colorScheme, i)
    const tbW = nodeR * 2 + 4

    specs.push(tag(
      { type: 'Circle', left: nx - nodeR, top: ny - nodeR, width: nodeR * 2, height: nodeR * 2, radius: nodeR, fill: color, strokeWidth: 0 },
      groupId, 'shape', i,
    ))

    if (data.options.showLabels) {
      specs.push(tag(
        {
          type: 'Textbox', left: nx - tbW / 2, top: ny - nodeR * 0.4, width: tbW, height: nodeR * 0.8,
          text: items[i].label,
          fontSize: items[i].fontSize ?? 11, fontWeight: items[i].fontWeight ?? 'bold',
          textAlign: 'center', fill: '#ffffff',
        },
        groupId, 'label', i,
      ))
    }
    if (data.options.showValues && items[i].value) {
      specs.push(tag(
        {
          type: 'Textbox', left: nx - tbW / 2, top: ny + nodeR * 0.15, width: tbW, height: 16,
          text: items[i].value!,
          fontSize: 10, textAlign: 'center', fill: 'rgba(255,255,255,0.85)',
        },
        groupId, 'value', i,
      ))
    }
  }
  return specs
}

export function renderVenn(data: AvnacInfographicData, groupId?: string): InfographicChildSpec[] {
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
    const color = items[i].color ?? colorAt(colorScheme, i)
    specs.push(tag(
      {
        type: 'Ellipse', left: x - r, top: y - r, width: r * 2, height: r * 2,
        rx: r, ry: r,
        fill: color + '99', stroke: color, strokeWidth: 1,
      },
      groupId, 'shape', i,
    ))
    if (data.options.showLabels && items[i]) {
      const tbW = r * 0.9
      specs.push(tag(
        {
          type: 'Textbox', left: x - tbW / 2, top: y - r * 0.6, width: tbW, height: 20,
          text: items[i].label,
          fontSize: items[i].fontSize ?? 11, fontWeight: items[i].fontWeight ?? 'bold',
          textAlign: 'center', fill: '#262626',
        },
        groupId, 'label', i,
      ))
    }
    if (items[i].sublabel) {
      const tbW = r * 0.9
      specs.push(tag(
        {
          type: 'Textbox', left: x - tbW / 2, top: y - r * 0.6 + 22, width: tbW, height: 16,
          text: items[i].sublabel!,
          fontSize: 10, textAlign: 'center', fill: '#555555',
        },
        groupId, 'sublabel', i,
      ))
    }
  }
  return specs
}

export function renderAccordion(data: AvnacInfographicData, groupId?: string): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const n = items.length
  const specs: InfographicChildSpec[] = []
  const rowH = height / n
  const headerW = width * 0.85
  // Number badge is a square: side = min(rowH-6, 32)
  const badgeSize = Math.min(rowH - 6, 32)
  const badgeLeft = 4
  const badgeTop = (rowH - badgeSize) / 2

  for (let i = 0; i < n; i++) {
    const y = i * rowH
    const color = items[i].color ?? colorAt(colorScheme, i)
    const hasSub = !!items[i].sublabel

    // Colored header bar
    specs.push(tag(
      { type: 'Rect', left: 0, top: y, width: headerW, height: rowH - 3, fill: color, rx: 4, ry: 4, strokeWidth: 0 },
      groupId, 'shape', i,
    ))

    // Number badge overlay
    specs.push(tag(
      { type: 'Rect', left: badgeLeft, top: y + badgeTop, width: badgeSize, height: badgeSize, fill: 'rgba(0,0,0,0.18)', rx: 4, ry: 4, strokeWidth: 0 },
      groupId, 'decoration', i,
    ))

    // Number text — centered inside badge
    specs.push(tag(
      {
        type: 'Textbox', left: badgeLeft, top: y + badgeTop + badgeSize / 2 - 9,
        width: badgeSize, height: 18,
        text: String(i + 1),
        fontSize: Math.min(13, badgeSize * 0.5), fontWeight: 'bold', textAlign: 'center', fill: '#ffffff',
      },
      groupId, 'decoration', i,
    ))

    // Label — INSIDE the colored bar, left of the badge
    const textLeft = badgeLeft + badgeSize + 6
    const textW = Math.max(40, headerW - textLeft - 8)
    if (data.options.showLabels) {
      const lblTop = hasSub
        ? y + rowH / 2 - 16    // shift up to make room for sublabel
        : y + rowH / 2 - 9
      specs.push(tag(
        {
          type: 'Textbox', left: textLeft, top: lblTop, width: textW, height: 18,
          text: items[i].label,
          fontSize: items[i].fontSize ?? 12, fontWeight: items[i].fontWeight ?? 'bold',
          fill: '#ffffff',
          textAlign: items[i].align ?? 'left',
        },
        groupId, 'label', i,
      ))
    }

    // Sublabel — INSIDE the colored bar, stacked below label
    if (hasSub) {
      specs.push(tag(
        {
          type: 'Textbox', left: textLeft, top: y + rowH / 2 + 2, width: textW, height: 16,
          text: items[i].sublabel!,
          fontSize: 10, fill: 'rgba(255,255,255,0.82)', textAlign: items[i].align ?? 'left',
        },
        groupId, 'sublabel', i,
      ))
    }
  }
  return specs
}

export function renderMatrix2x2(data: AvnacInfographicData, groupId?: string): InfographicChildSpec[] {
  const { items, options: { width, height, colorScheme } } = data
  const specs: InfographicChildSpec[] = []
  const hw = width / 2, hh = height / 2
  const positions = [
    { x: 0, y: 0 }, { x: hw, y: 0 },
    { x: 0, y: hh }, { x: hw, y: hh },
  ]
  const padX = 8, padY = 10
  const tbW = hw - padX * 2

  for (let i = 0; i < 4; i++) {
    const { x, y } = positions[i]
    const item = items[i] ?? { label: '' }
    const color = items[i]?.color ?? colorAt(colorScheme, i)

    specs.push(tag(
      { type: 'Rect', left: x + 2, top: y + 2, width: hw - 4, height: hh - 4, fill: color + '44', stroke: color, strokeWidth: 1, rx: 4, ry: 4 },
      groupId, 'shape', i,
    ))
    if (data.options.showLabels) {
      specs.push(tag(
        {
          type: 'Textbox', left: x + padX, top: y + padY, width: tbW, height: 20,
          text: item.label,
          fontSize: item.fontSize ?? 13, fontWeight: item.fontWeight ?? 'bold',
          textAlign: item.align ?? 'center', fill: '#262626',
        },
        groupId, 'label', i,
      ))
    }
    if (item.sublabel) {
      specs.push(tag(
        {
          type: 'Textbox', left: x + padX, top: y + padY + 22, width: tbW, height: Math.max(30, hh - padY - 28),
          text: item.sublabel,
          fontSize: 10, textAlign: 'center', fill: '#666666',
        },
        groupId, 'sublabel', i,
      ))
    }
  }

  // Divider lines
  specs.push(tag(
    { type: 'Rect', left: hw - 1, top: 0, width: 2, height, fill: '#dddddd', strokeWidth: 0 },
    groupId, 'decoration', -1,
  ))
  specs.push(tag(
    { type: 'Rect', left: 0, top: hh - 1, width, height: 2, fill: '#dddddd', strokeWidth: 0 },
    groupId, 'decoration', -1,
  ))

  return specs
}

export type InfographicRenderFn = (data: AvnacInfographicData, groupId?: string) => InfographicChildSpec[]

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

export function renderInfographic(data: AvnacInfographicData, groupId?: string): InfographicChildSpec[] {
  const fn = INFOGRAPHIC_RENDERERS[data.template]
  return fn ? fn(data, groupId) : []
}
