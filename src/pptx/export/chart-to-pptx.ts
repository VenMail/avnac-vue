import type PptxGenJS from 'pptxgenjs'
import type { AvnacChartData } from '#/lib/avnac-chart-data'
import { chartTypeToPptxType } from '#/lib/avnac-chart-data'

export interface FabricChartImageLike {
  left: number
  top: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  avnacChart?: AvnacChartData
  src?: string
}

export function addChartToPptx(
  slide: PptxGenJS.Slide,
  obj: FabricChartImageLike,
  artboardW: number,
  artboardH: number,
  slideW: number,
  slideH: number,
): void {
  const scaleX = obj.scaleX ?? 1
  const scaleY = obj.scaleY ?? 1
  const w = Math.max(0.1, (obj.width * scaleX) / artboardW * slideW)
  const h = Math.max(0.1, (obj.height * scaleY) / artboardH * slideH)
  const x = obj.left / artboardW * slideW
  const y = obj.top / artboardH * slideH
  const rotate = Math.round(obj.angle ?? 0)

  const chart = obj.avnacChart
  if (!chart) return

  // Build pptxgenjs chart data format
  const chartType = chartTypeToPptxType(chart.type) as PptxGenJS.CHART_NAME

  const chartData = chart.series.map(s => ({
    name: s.name,
    labels: chart.labels,
    values: s.data,
  }))

  const chartColors = chart.options.colorScheme.length > 0
    ? chart.options.colorScheme.map(c => c.replace('#', ''))
    : undefined

  const opts: PptxGenJS.IChartOpts = {
    x, y, w, h,
    ...(rotate ? { rotate } : {}),
    showLegend: chart.options.showLegend,
    showValue: chart.options.showDataLabels,
    ...(chartColors ? { chartColors } : {}),
  }

  if (chart.type === 'bar-stacked') {
    (opts as any).barGrouping = 'stacked'
  } else if (chart.type === 'bar-100') {
    (opts as any).barGrouping = 'percentStacked'
  }

  try {
    slide.addChart(chartType, chartData, opts)
  } catch {
    // pptxgenjs may not support all chart types — fall back to image if src available
    if (obj.src) {
      const dataStr = obj.src.startsWith('data:')
        ? obj.src.split(',')[1] ?? obj.src
        : obj.src
      slide.addImage({ data: dataStr, x, y, w, h, rotate })
    }
  }
}

// Fallback: export chart as image (rasterized) — used when avnacChart is missing
export function addChartImageToPptx(
  slide: PptxGenJS.Slide,
  obj: FabricChartImageLike,
  artboardW: number,
  artboardH: number,
  slideW: number,
  slideH: number,
): void {
  if (!obj.src) return
  const scaleX = obj.scaleX ?? 1
  const scaleY = obj.scaleY ?? 1
  const w = Math.max(0.1, (obj.width * scaleX) / artboardW * slideW)
  const h = Math.max(0.1, (obj.height * scaleY) / artboardH * slideH)
  const x = obj.left / artboardW * slideW
  const y = obj.top / artboardH * slideH
  const rotate = Math.round(obj.angle ?? 0)
  const dataStr = obj.src.startsWith('data:') ? obj.src.split(',')[1] ?? obj.src : obj.src
  slide.addImage({ data: dataStr, x, y, w, h, rotate })
}
