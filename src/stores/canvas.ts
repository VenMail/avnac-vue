import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BgValue } from '#/lib/bg-value'
import type { FabricShadowUi } from '#/lib/avnac-fabric-shadow'
import type { AvnacShapeMeta } from '#/lib/avnac-shape-meta'

export interface TextFormatToolbarValues {
  fontFamily: string
  fontSize: number
  fillStyle: BgValue
  textAlign: 'left' | 'center' | 'right' | 'justify'
  bold: boolean
  italic: boolean
  underline: boolean
  lineHeight: number
}

export interface ShapeToolbarModel {
  meta: AvnacShapeMeta
  paint: BgValue
  rectCornerRadius?: number
  rectCornerRadiusMax?: number
}

export interface TransformDimensionUi {
  w: number
  h: number
  x: number
  y: number
  angle: number
}

const DEFAULT_PAINT: BgValue = { type: 'solid', color: '#262626' }
const DEFAULT_SHADOW_UI: FabricShadowUi = {
  blur: 14,
  offsetX: 6,
  offsetY: 6,
  opacityPct: 35,
  colorHex: '#000000',
}

export const useCanvasStore = defineStore('canvas', () => {
  // Artboard / canvas level
  const artboardSize = ref<{ w: number; h: number }>({ w: 4000, h: 4000 })
  const zoomPercent = ref<number | null>(null)
  const bgValue = ref<BgValue>({ type: 'solid', color: '#ffffff' })
  const ready = ref(false)

  // Selection level
  const hasObjectSelected = ref(false)
  const canvasBodySelected = ref(false)
  const selectionRev = ref(0)
  const textToolbarValues = ref<TextFormatToolbarValues | null>(null)
  const selectedPaint = ref<BgValue>({ ...DEFAULT_PAINT })
  const shapeToolbarModel = ref<ShapeToolbarModel | null>(null)
  const imageCornerToolbar = ref<{ radius: number; max: number } | null>(null)
  const selectionBlurPct = ref(0)
  const selectionOpacityPct = ref(100)
  const selectionOutlineStrokeWidth = ref(0)
  const selectionOutlineStrokePaint = ref<BgValue>({ type: 'solid', color: '#000000' })
  const selectionShadowUi = ref<FabricShadowUi>({ ...DEFAULT_SHADOW_UI })
  const selectionShadowActive = ref(false)
  const transformDimensionUi = ref<TransformDimensionUi | null>(null)

  function tickSelection() {
    selectionRev.value++
  }

  function clearSelection() {
    hasObjectSelected.value = false
    canvasBodySelected.value = false
    textToolbarValues.value = null
    shapeToolbarModel.value = null
    imageCornerToolbar.value = null
    selectionBlurPct.value = 0
    selectionOpacityPct.value = 100
    selectionOutlineStrokeWidth.value = 0
    transformDimensionUi.value = null
    selectionShadowActive.value = false
    tickSelection()
  }

  return {
    artboardSize,
    zoomPercent,
    bgValue,
    ready,
    hasObjectSelected,
    canvasBodySelected,
    selectionRev,
    textToolbarValues,
    selectedPaint,
    shapeToolbarModel,
    imageCornerToolbar,
    selectionBlurPct,
    selectionOpacityPct,
    selectionOutlineStrokeWidth,
    selectionOutlineStrokePaint,
    selectionShadowUi,
    selectionShadowActive,
    transformDimensionUi,
    tickSelection,
    clearSelection,
  }
})
