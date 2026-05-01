export type InfographicTemplate =
  | 'pyramid' | 'funnel'
  | 'timeline-h' | 'timeline-v'
  | 'chevron' | 'cycle' | 'venn'
  | 'accordion' | 'matrix-2x2'

export interface InfographicItem {
  label: string
  sublabel?: string
  value?: string
  color?: string
  fontSize?: number
  sublabelFontSize?: number
  valueFontSize?: number
  fontWeight?: string
  align?: 'left' | 'center' | 'right'
}

export interface AvnacInfographicData {
  template: InfographicTemplate
  items: InfographicItem[]
  options: {
    width: number
    height: number
    colorScheme: string[]
    showValues: boolean
    showLabels: boolean
    markerSize?: number
  }
}

export const INFOGRAPHIC_TEMPLATE_CONSTRAINTS: Record<
  InfographicTemplate,
  { minItems: number; maxItems: number; fixed?: boolean }
> = {
  pyramid:       { minItems: 2, maxItems: 6 },
  funnel:        { minItems: 2, maxItems: 6 },
  'timeline-h':  { minItems: 2, maxItems: 8 },
  'timeline-v':  { minItems: 2, maxItems: 8 },
  chevron:       { minItems: 2, maxItems: 6 },
  cycle:         { minItems: 3, maxItems: 8 },
  venn:          { minItems: 3, maxItems: 3, fixed: true },
  accordion:     { minItems: 1, maxItems: 8 },
  'matrix-2x2':  { minItems: 4, maxItems: 4, fixed: true },
}

const DEFAULT_COLORS = [
  '#4472c4', '#ed7d31', '#a9d18e', '#ffc000', '#70ad47', '#ff6b6b',
  '#c55a11', '#7030a0',
]

const DEFAULT_ITEMS_3: InfographicItem[] = [
  { label: 'Step 1', sublabel: 'Description here', value: '33%' },
  { label: 'Step 2', sublabel: 'Description here', value: '33%' },
  { label: 'Step 3', sublabel: 'Description here', value: '34%' },
]

export function defaultInfographicData(template: InfographicTemplate): AvnacInfographicData {
  const isMatrix = template === 'matrix-2x2'
  const isVenn = template === 'venn'
  const isCycle = template === 'cycle'

  const items = isMatrix
    ? [
        { label: 'Invest', sublabel: 'High impact, High effort' },
        { label: 'Quick Wins', sublabel: 'High impact, Low effort' },
        { label: 'Low Priority', sublabel: 'Low impact, High effort' },
        { label: 'Fill-ins', sublabel: 'Low impact, Low effort' },
      ]
    : isVenn
    ? [
        { label: 'Group A', sublabel: 'Unique to A' },
        { label: 'Group B', sublabel: 'Unique to B' },
        { label: 'Both', sublabel: 'Shared' },
      ]
    : isCycle
    ? [
        { label: 'Plan', value: '1' },
        { label: 'Do', value: '2' },
        { label: 'Check', value: '3' },
        { label: 'Act', value: '4' },
      ]
    : DEFAULT_ITEMS_3

  return {
    template,
    items,
    options: {
      width: 600,
      height: 400,
      colorScheme: DEFAULT_COLORS.slice(0, items.length),
      showValues: true,
      showLabels: true,
      markerSize: template === 'timeline-h' || template === 'timeline-v' ? 34 : undefined,
    },
  }
}
