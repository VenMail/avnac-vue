export type FabricShapeSpec =
  | { type: 'Rect'; rx?: number }
  | { type: 'Ellipse' }
  | { type: 'Polygon'; pointsFn: (w: number, h: number) => Array<{ x: number; y: number }> }
  | { type: 'Path'; pathFn: (w: number, h: number) => string }

// Returns normalized points for polygon shapes
function pts(...coords: number[][]): (w: number, h: number) => Array<{ x: number; y: number }> {
  // coords are [rx, ry] fractions of w/h
  return (w, h) => coords.map(([rx, ry]) => ({ x: rx * w, y: ry * h }))
}

// Diamond path: 4 corners at midpoints
const diamond = pts([0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5])

// Triangle (isosceles): top-center, bottom-right, bottom-left
const triangle = pts([0.5, 0], [1, 1], [0, 1])

// Right triangle: top-left, bottom-right, bottom-left
const rtTriangle = pts([0, 0], [1, 1], [0, 1])

// Parallelogram: shear 20% to the right
const parallelogram = pts([0.2, 0], [1, 0], [0.8, 1], [0, 1])

// Trapezoid: wider at bottom, narrower at top
const trapezoid = pts([0.15, 0], [0.85, 0], [1, 1], [0, 1])

// Pentagon (5 sides)
function regularPolygon(n: number, startAngle = -Math.PI / 2) {
  return (w: number, h: number) => {
    const cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2
    return Array.from({ length: n }, (_, i) => {
      const a = startAngle + (2 * Math.PI * i) / n
      return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }
    })
  }
}

// Star builder: n-pointed star
function starPolygon(n: number, innerRatio = 0.4) {
  return (w: number, h: number) => {
    const cx = w / 2, cy = h / 2, ro = Math.min(w, h) / 2, ri = ro * innerRatio
    const points: Array<{ x: number; y: number }> = []
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / n
      const r = i % 2 === 0 ? ro : ri
      points.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
    }
    return points
  }
}

// Arrow shapes (right arrow)
const rightArrow = pts([0, 0.25], [0.65, 0.25], [0.65, 0], [1, 0.5], [0.65, 1], [0.65, 0.75], [0, 0.75])
const leftArrow = pts([0, 0.5], [0.35, 0], [0.35, 0.25], [1, 0.25], [1, 0.75], [0.35, 0.75], [0.35, 1])
const upArrow = pts([0.5, 0], [1, 0.35], [0.75, 0.35], [0.75, 1], [0.25, 1], [0.25, 0.35], [0, 0.35])
const downArrow = pts([0.5, 1], [1, 0.65], [0.75, 0.65], [0.75, 0], [0.25, 0], [0.25, 0.65], [0, 0.65])
const leftRightArrow = pts([0, 0.5], [0.25, 0], [0.25, 0.3], [0.75, 0.3], [0.75, 0], [1, 0.5], [0.75, 1], [0.75, 0.7], [0.25, 0.7], [0.25, 1])

// Chevron (pointing right)
const chevron = pts([0, 0], [0.7, 0], [1, 0.5], [0.7, 1], [0, 1], [0.3, 0.5])

// Flowchart terminal (stadium — handled as roundRect with rx=h/2)

// Flowchart IO (parallelogram)
const ioShape = pts([0.15, 0], [1, 0], [0.85, 1], [0, 1])

// Ribbon / banner (rect with notched ends — approximate as rect)
// Callout1: rect with tail — approximate as rect

// Map from OOXML prstGeom prst value → FabricShapeSpec
export const PRST_GEOM_MAP: Record<string, FabricShapeSpec> = {
  rect: { type: 'Rect', rx: 0 },
  ellipse: { type: 'Ellipse' },
  roundRect: { type: 'Rect', rx: 8 },  // rx applied as fraction later
  diamond: { type: 'Polygon', pointsFn: diamond },
  triangle: { type: 'Polygon', pointsFn: triangle },
  rtTriangle: { type: 'Polygon', pointsFn: rtTriangle },
  parallelogram: { type: 'Polygon', pointsFn: parallelogram },
  trapezoid: { type: 'Polygon', pointsFn: trapezoid },
  pentagon: { type: 'Polygon', pointsFn: regularPolygon(5) },
  hexagon: { type: 'Polygon', pointsFn: regularPolygon(6, 0) },
  heptagon: { type: 'Polygon', pointsFn: regularPolygon(7) },
  octagon: { type: 'Polygon', pointsFn: regularPolygon(8, 0) },
  star4: { type: 'Polygon', pointsFn: starPolygon(4) },
  star5: { type: 'Polygon', pointsFn: starPolygon(5) },
  star6: { type: 'Polygon', pointsFn: starPolygon(6, 0.5) },
  star8: { type: 'Polygon', pointsFn: starPolygon(8) },
  rightArrow: { type: 'Polygon', pointsFn: rightArrow },
  leftArrow: { type: 'Polygon', pointsFn: leftArrow },
  upArrow: { type: 'Polygon', pointsFn: upArrow },
  downArrow: { type: 'Polygon', pointsFn: downArrow },
  leftRightArrow: { type: 'Polygon', pointsFn: leftRightArrow },
  chevron: { type: 'Polygon', pointsFn: chevron },
  flowChartProcess: { type: 'Rect', rx: 0 },
  flowChartDecision: { type: 'Polygon', pointsFn: diamond },
  flowChartTerminator: { type: 'Rect', rx: 999 },  // pill — clamped later
  flowChartAlternateProcess: { type: 'Rect', rx: 8 },
  flowChartPredefinedProcess: { type: 'Rect', rx: 0 },
  flowChartInternalStorage: { type: 'Rect', rx: 0 },
  flowChartDocument: { type: 'Rect', rx: 0 },  // approximate
  flowChartMultidocument: { type: 'Rect', rx: 0 },
  flowChartIO: { type: 'Polygon', pointsFn: ioShape },
  ribbon: { type: 'Rect', rx: 0 },
  ribbon2: { type: 'Rect', rx: 0 },
  callout1: { type: 'Rect', rx: 0 },
  callout2: { type: 'Rect', rx: 0 },
  callout3: { type: 'Rect', rx: 0 },
  bentArrow: { type: 'Polygon', pointsFn: rightArrow },  // approximate
  uturnArrow: { type: 'Polygon', pointsFn: upArrow },    // approximate
  circularArrow: { type: 'Ellipse' },                    // approximate
  line: { type: 'Rect', rx: 0 },  // handled separately as connector
  straightConnector1: { type: 'Rect', rx: 0 },
}

export function getPrstGeomSpec(prst: string): FabricShapeSpec {
  return PRST_GEOM_MAP[prst] ?? { type: 'Rect', rx: 0 }
}
