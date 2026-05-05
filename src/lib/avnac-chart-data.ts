export type ChartType =
  | 'bar' | 'bar-stacked' | 'bar-100'
  | 'line' | 'area'
  | 'pie' | 'doughnut'
  | 'scatter' | 'radar'

export interface AvnacChartSeries {
  name: string
  data: number[]
  color?: string
}

export interface AvnacChartData {
  type: ChartType
  title?: string
  labels: string[]
  series: AvnacChartSeries[]
  options: {
    showLegend: boolean
    showDataLabels: boolean
    colorScheme: string[]
    xAxisLabel?: string
    yAxisLabel?: string
  }
}

const DEFAULT_COLORS = [
  '#4472c4', '#ed7d31', '#a9d18e', '#ffc000', '#70ad47',
  '#ff0000', '#7030a0', '#00b0f0', '#ff66cc', '#595959',
]

const DEFAULT_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

export function defaultChartData(type: ChartType): AvnacChartData {
  const isPie = type === 'pie' || type === 'doughnut'
  const isScatter = type === 'scatter'
  const isRadar = type === 'radar'

  const labels = isPie
    ? ['Segment A', 'Segment B', 'Segment C', 'Segment D']
    : isRadar
    ? ['Speed', 'Power', 'Range', 'Accuracy', 'Durability']
    : DEFAULT_LABELS

  const series: AvnacChartSeries[] = isPie
    ? [{ name: 'Values', data: [35, 25, 25, 15], color: DEFAULT_COLORS[0] }]
    : isScatter
    ? [
        { name: 'Series 1', data: [10, 20, 15, 30, 25, 40], color: DEFAULT_COLORS[0] },
        { name: 'Series 2', data: [5, 15, 25, 20, 35, 30], color: DEFAULT_COLORS[1] },
      ]
    : isRadar
    ? [
        { name: 'Product A', data: [80, 70, 90, 60, 85], color: DEFAULT_COLORS[0] },
        { name: 'Product B', data: [60, 85, 70, 80, 65], color: DEFAULT_COLORS[1] },
      ]
    : [
        { name: 'Series 1', data: [42, 58, 67, 44, 90, 73], color: DEFAULT_COLORS[0] },
        { name: 'Series 2', data: [30, 45, 52, 38, 72, 60], color: DEFAULT_COLORS[1] },
      ]

  return {
    type,
    labels,
    series,
    options: {
      showLegend: true,
      showDataLabels: false,
      colorScheme: DEFAULT_COLORS.slice(0, isPie ? labels.length : series.length),
    },
  }
}

// Map AvnacChartData type → pptxgenjs chart type string
export function chartTypeToPptxType(type: ChartType): string {
  const MAP: Record<ChartType, string> = {
    bar: 'bar',
    'bar-stacked': 'bar',
    'bar-100': 'bar',
    line: 'line',
    area: 'area',
    pie: 'pie',
    doughnut: 'doughnut',
    scatter: 'scatter',
    radar: 'radar',
  }
  return MAP[type] ?? 'bar'
}
