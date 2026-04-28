// Parse <p:graphicFrame> containing <c:chart> → FabricObjectSpec with avnacChart metadata
// The actual chart image is rendered lazily by the canvas when useChartRenderer is available
import type { FabricObjectSpec } from './ooxml-to-fabric'
import type { AvnacChartData, ChartType } from '#/lib/avnac-chart-data'
import { emuToPx } from './emu-to-px'

const ARTBOARD_W = 4000
const ARTBOARD_H = 4000

function q(el: Element | Document | null | undefined, selector: string): Element | null {
  return el?.querySelector(selector) ?? null
}
function qs(el: Element | Document | null | undefined, selector: string): Element[] {
  return el ? Array.from(el.querySelectorAll(selector)) : []
}

function emuX(emu: string | null, slideW: number) {
  return emuToPx(parseInt(emu ?? '0', 10), ARTBOARD_W, slideW)
}
function emuY(emu: string | null, slideH: number) {
  return emuToPx(parseInt(emu ?? '0', 10), ARTBOARD_H, slideH)
}

function detectChartType(chartXml: Document): ChartType {
  // Check what chart element types are present
  const tags = ['barChart', 'lineChart', 'pieChart', 'doughnutChart', 'areaChart', 'scatterChart', 'radarChart']
  for (const tag of tags) {
    if (q(chartXml, tag)) {
      if (tag === 'barChart') {
        // Check for stacked
        const barDir = q(chartXml, 'barChart')
        const grouping = q(barDir, 'grouping')?.getAttribute('val') ?? 'clustered'
        if (grouping === 'stacked') return 'bar-stacked'
        if (grouping === 'percentStacked') return 'bar-100'
        return 'bar'
      }
      const TYPE_MAP: Record<string, ChartType> = {
        lineChart: 'line',
        pieChart: 'pie',
        doughnutChart: 'doughnut',
        areaChart: 'area',
        scatterChart: 'scatter',
        radarChart: 'radar',
      }
      return TYPE_MAP[tag] ?? 'bar'
    }
  }
  return 'bar'
}

function parseChartLabels(chartXml: Document): string[] {
  // Try to extract category axis labels from first series
  const cats = qs(chartXml, 'cat numRef v, cat strRef v')
  if (cats.length > 0) return cats.map(el => el.textContent ?? '')

  const strCache = qs(chartXml, 'strCache pt v')
  if (strCache.length > 0) return strCache.map(el => el.textContent ?? '')

  return ['A', 'B', 'C', 'D', 'E', 'F']
}

function parseSeries(chartXml: Document): AvnacChartData['series'] {
  const serElements = qs(chartXml, 'ser')
  const series: AvnacChartData['series'] = []

  for (const ser of serElements) {
    const txEl = q(ser, 'tx strRef strCache pt v') ?? q(ser, 'tx v')
    const name = txEl?.textContent ?? `Series ${series.length + 1}`

    // Get data values
    const vals = qs(ser, 'val numRef numCache pt v')
    const data = vals.length > 0
      ? vals.map(v => parseFloat(v.textContent ?? '0') || 0)
      : [0]

    // Try to get color
    const srgb = q(ser, 'spPr solidFill srgbClr')
    const color = srgb ? '#' + (srgb.getAttribute('val') ?? '4472c4') : undefined

    series.push({ name, data, color })
  }

  return series.length > 0 ? series : [{ name: 'Series 1', data: [10, 20, 30] }]
}

// Parse a <p:graphicFrame> element that contains a chart relationship
// chartXmlMap: rId → parsed chart XML Document
export function parseGraphicFrameChart(
  graphicFrame: Element,
  slideW: number,
  slideH: number,
  chartXmlMap: Map<string, Document>,
): FabricObjectSpec | null {
  try {
    const xfrm = q(graphicFrame, 'xfrm')
    const off = q(xfrm, 'off')
    const ext = q(xfrm, 'ext')

    const x = emuX(off?.getAttribute('x') ?? null, slideW)
    const y = emuY(off?.getAttribute('y') ?? null, slideH)
    const w = emuX(ext?.getAttribute('cx') ?? null, slideW)
    const h = emuY(ext?.getAttribute('cy') ?? null, slideH)

    // Get chart rId from the graphic data
    const chartEl = q(graphicFrame, 'chart')
    const rId = chartEl?.getAttribute('r:id') ?? chartEl?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ?? ''

    const chartXml = chartXmlMap.get(rId)
    if (!chartXml) {
      // Unknown chart reference — emit a placeholder rect
      return {
        type: 'Rect',
        left: x, top: y,
        width: w || 400, height: h || 300,
        angle: 0,
        fill: '#f0f0f0',
        avnacFill: { type: 'solid', color: '#f0f0f0' },
        rx: 4, ry: 4,
        avnacChartPlaceholder: true,
      }
    }

    const type = detectChartType(chartXml)
    const labels = parseChartLabels(chartXml)
    const series = parseSeries(chartXml)

    const avnacChart: AvnacChartData = {
      type,
      labels,
      series,
      options: {
        showLegend: true,
        showDataLabels: false,
        colorScheme: series.map(s => s.color ?? '#4472c4').filter(Boolean),
      },
    }

    // Return as Image placeholder — canvas will render via useChartRenderer
    return {
      type: 'Image',
      left: x, top: y,
      width: w || 400, height: h || 300,
      angle: 0,
      src: '',  // empty — canvas renders from avnacChart
      avnacChart,
    }
  } catch {
    return null
  }
}
