import type { AvnacChartData } from '#/lib/avnac-chart-data'

type ChartjsConfig = {
  type: string
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string
      fill?: boolean
    }>
  }
  options: Record<string, unknown>
}

function buildChartjsConfig(data: AvnacChartData): ChartjsConfig {
  const { type, labels, series, options } = data
  const colors = options.colorScheme.length > 0
    ? options.colorScheme
    : series.map((s, i) => s.color ?? `hsl(${(i * 60) % 360}, 65%, 50%)`)

  const isPie = type === 'pie' || type === 'doughnut'
  const isArea = type === 'area'

  const datasets = series.map((s, i) => ({
    label: s.name,
    data: s.data,
    backgroundColor: isPie
      ? colors
      : (colors[i] ?? '#4472c4') + '99',
    borderColor: colors[i] ?? '#4472c4',
    fill: isArea,
    tension: isArea ? 0.4 : 0,
  }))

  const chartjsType = type === 'bar' || type === 'bar-stacked' || type === 'bar-100'
    ? 'bar'
    : type === 'area' ? 'line'
    : type

  const opts: Record<string, unknown> = {
    responsive: false,
    animation: false,
    plugins: {
      legend: { display: options.showLegend },
      datalabels: options.showDataLabels ? {} : false,
    },
  }

  if (type === 'bar-stacked' || type === 'bar-100') {
    opts.scales = {
      x: { stacked: true },
      y: { stacked: true, max: type === 'bar-100' ? 100 : undefined },
    }
  }

  return { type: chartjsType, data: { labels, datasets }, options: opts }
}

export async function renderChartToDataUrl(
  data: AvnacChartData,
  w: number,
  h: number,
): Promise<string> {
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h

  const config = buildChartjsConfig(data)
  const chart = new Chart(canvas, config as any)

  // Let chart render (chart.js renders synchronously after register, but give it a tick)
  await new Promise<void>(resolve => setTimeout(resolve, 60))

  const url = canvas.toDataURL('image/png')
  chart.destroy()

  return url
}
