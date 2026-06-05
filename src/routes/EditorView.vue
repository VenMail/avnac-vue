<template>
  <div class="editor-view" style="width:100vw;height:100vh;display:flex;flex-direction:column;">
    <CanvasEditor
      ref="editorRef"
      :initial-document="initialDocument"
      :plugins="editorPlugins"
      @change="onDocumentChange"
      @ready="onEditorReady"
    >
      <!-- Floating toolbar slot -->
      <template #toolbar>
        <CanvasElementToolbar
          :smart-object-selected="smartObjectSelected"
          @paint-change="onPaintChange"
          @text-format-change="onTextFormatChange"
          @shape-paint-change="onShapePaintChange"
          @corner-radius-change="onCornerRadiusChange"
          @image-corner-radius-change="onImageCornerRadiusChange"
          @image-mask-change="onImageMaskChange"
          @crop-image="onCropImage"
          @line-path-type-change="onLinePathTypeChange"
          @line-arrow-head-change="onLineArrowHeadChange"
          @line-style-change="onLineStyleChange"
          @stroke-width-change="onStrokeWidthChange"
          @stroke-paint-change="onStrokePaintChange"
          @blur-change="onBlurChange"
          @opacity-change="onOpacityChange"
          @shadow-change="onShadowChange"
          @shadow-toggle="onShadowToggle"
          @delete="onDeleteSelected"
          @open-animation-panel="animationPanelOpen = true"
          @edit-chart-data="onEditChartData"
          @convert-smart-object="onConvertSmartObject"
        />
        <EditorAnimationPanel
          v-if="animationPanelOpen"
          :canvas="getCanvas()"
          style="position: absolute; right: 12px; top: 60px; z-index: 50;"
          @close="animationPanelOpen = false"
        />
      </template>

      <!-- Sidebar slot -->
      <template #sidebar>
        <div class="flex gap-2 p-3">
          <EditorFloatingSidebar
            :active-panel="activePanel"
            @select-panel="togglePanel"
            @insert-text="onAddText"
            @insert-image="onAddImage"
            @insert-shape="onShapePick"
            @insert-line="onLinePick"
            @start-pen="editorRef?.shapeTools.startPenDrawMode()"
          />
          <EditorLayersPanel
            :open="activePanel === 'layers'"
            :rows="layerRows"
            @close="activePanel = null"
            @select-layer="onSelectLayer"
            @toggle-visible="onToggleVisible"
            @bring-forward="onBringForward"
            @send-backward="onSendBackward"
            @reorder="onReorderLayers"
            @rename-layer="onRenameLayer"
          />
          <EditorImagesPanel
            :open="activePanel === 'images'"
            :on-add-image-from-url="onAddImageFromUrl"
            :on-add-image-from-file="(f) => editorRef?.shapeTools.addImageFromFile(f)"
            @close="activePanel = null"
          />
          <EditorUploadsPanel
            :open="activePanel === 'uploads'"
            :on-add-image-from-file="(f) => editorRef?.shapeTools.addImageFromFile(f)"
            @close="activePanel = null"
          />
          <EditorAiPanel
            :open="activePanel === 'ai'"
            @close="activePanel = null"
            @generate="onAiGenerate"
          />
          <EditorAppsPanel
            :open="activePanel === 'apps'"
            @close="activePanel = null"
            @template-insert="onTemplateInsert"
          />
          <div v-if="activePanel === 'charts'" class="avnac-side-panel">
            <ChartDataPanel @insert="onInsertChart" @done="activePanel = null" />
          </div>
          <div v-if="activePanel === 'infographics'" class="avnac-side-panel">
            <InfographicPanel @insert="onInsertInfographic" />
          </div>
          <div v-if="activePanel === 'diagrams'" class="avnac-side-panel">
            <DiagramPanel @insert="onInsertDiagram" />
          </div>
        </div>
      </template>

      <!-- Bottom bar slot -->
      <template #bottom-bar>
        <div class="avnac-editor-bottom-bar-content flex items-center justify-center gap-4 p-3">
          <button class="avnac-icon-btn" title="Add image" @click="onAddImage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <PaintPopoverControl :value="canvasStore.bgValue" title="Background" @change="onBgChange" />
          <CanvasZoomSlider
            :value="canvasStore.zoomPercent ?? 100"
            :on-fit-request="() => editorRef?.fitToViewport()"
            @change="editorRef?.setZoom($event)"
            @fit-request="editorRef?.fitToViewport()"
          />
          <button class="avnac-icon-btn" title="Export PPTX" @click="onExportPptx">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button class="avnac-icon-btn" title="Import PPTX" @click="onImportPptx">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
      </template>
    </CanvasEditor>
    <ImageCropModal
      :open="cropModalOpen"
      :image-src="cropImageSrc"
      :initial-crop="cropInitial"
      @cancel="cropModalOpen = false"
      @apply="onApplyImageCrop"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CanvasEditor from '#/components/canvas/CanvasEditor.vue'
import CanvasElementToolbar from '#/components/toolbar/CanvasElementToolbar.vue'
import EditorFloatingSidebar from '#/components/panels/EditorFloatingSidebar.vue'
import EditorLayersPanel from '#/components/panels/EditorLayersPanel.vue'
import CanvasZoomSlider from '#/components/toolbar/CanvasZoomSlider.vue'
import PaintPopoverControl from '#/components/shared/PaintPopoverControl.vue'
import EditorImagesPanel from '#/components/panels/EditorImagesPanel.vue'
import EditorUploadsPanel from '#/components/panels/EditorUploadsPanel.vue'
import EditorAiPanel from '#/components/panels/EditorAiPanel.vue'
import EditorAppsPanel from '#/components/panels/EditorAppsPanel.vue'
import EditorAnimationPanel from '#/components/panels/EditorAnimationPanel.vue'
import ChartDataPanel from '#/components/charts/ChartDataPanel.vue'
import ImageCropModal from '#/components/modals/ImageCropModal.vue'
import InfographicPanel from '#/components/infographics/InfographicPanel.vue'
import DiagramPanel from '#/components/diagrams/DiagramPanel.vue'
import type { EditorLayerRow } from '#/components/panels/EditorLayersPanel.vue'
import type { EditorSidebarPanelId } from '#/lib/editor-sidebar-panel-layout'
import { cloneAvnacPlain, type AvnacDocumentV1 } from '#/lib/avnac-document'
import type { BgValue } from '#/lib/bg-value'
import type { FabricShadowUi } from '#/lib/avnac-fabric-shadow'
import type { TextFormatToolbarValues } from '#/stores/canvas'
import { useCanvasStore } from '#/stores/canvas'
import { useChartsStore } from '#/stores/charts'
import { useInfographicsStore } from '#/stores/infographics'
import { useDiagramsStore } from '#/stores/diagrams'
import { exportDocumentsToPptx } from '#/pptx/export'
import { importPptxFromInput } from '#/pptx/import'
import { applyTextFormatChange } from '#/lib/apply-text-format'
import { applyFabricImageMask, type ImageMaskKind } from '#/lib/fabric-image-mask'
import { applyFabricImageSourceCrop, getFabricImageSourceCrop } from '#/lib/avnac-fabric-image-crop'
import { layoutArrowGroup, arrowDisplayColor } from '#/lib/avnac-stroke-arrow'
import { avnacStrokeLineHeadType, getAvnacShapeMeta, isArrowHeadVisible, setAvnacShapeMeta, type ArrowHeadType, type ArrowLineStyle, type ArrowPathType } from '#/lib/avnac-shape-meta'
import { getAvnacStroke } from '#/lib/avnac-fill-paint'
import type { AvnacChartData } from '#/lib/avnac-chart-data'
import { ensureAvnacLayerId } from '#/lib/ensure-avnac-layer-id'
import type { AvnacInfographicData } from '#/lib/avnac-infographic'
import type { AvnacDiagramData } from '#/lib/avnac-diagram'
import {
  createAvnacSmartObjectsPlugin,
  type AvnacSmartObjectData,
  type SelectedSmartObjectInfo,
  type SmartObjectInsertResult,
} from '#/plugins/smart-objects'

const editorRef = ref<InstanceType<typeof CanvasEditor> | null>(null)
const initialDocument = ref<AvnacDocumentV1 | undefined>(undefined)
const activePanel = ref<EditorSidebarPanelId | null>(null)
const canvasStore = useCanvasStore()
const chartsStore = useChartsStore()
const infographicsStore = useInfographicsStore()
const diagramsStore = useDiagramsStore()
const animationPanelOpen = ref(false)
const cropModalOpen = ref(false)
const cropImageSrc = ref('')
const cropInitial = ref({ x: 0, y: 0, w: 1, h: 1 })
const editorPlugins = [createAvnacSmartObjectsPlugin()]
const smartObjectSelected = ref(false)
let suppressSmartStoreRender = false

// Layer panel rows from the layer panel composable
const layerRows = computed<EditorLayerRow[]>(() => {
  const lp = editorRef.value?.layerPanel
  if (!lp) return []
  return lp.layers.value.map((l: any) => ({
    id: l.id as string,
    stackIndex: l.index as number,
    label: (l.label as string) || 'Layer',
    visible: (l.visible as boolean) ?? true,
    selected: (l.selected as boolean) ?? false,
  }))
})

async function togglePanel(id: EditorSidebarPanelId) {
  if (id === 'vector-board') {
    activePanel.value = null
    editorRef.value?.shapeTools.startPenDrawMode()
    return
  }
  activePanel.value = activePanel.value === id ? null : id
  if (activePanel.value === 'charts') openSelectedChartInPanel()
  if (activePanel.value === 'infographics' || activePanel.value === 'diagrams') {
    await openSelectedSmartObjectInPanel(activePanel.value)
  }
}

function onDocumentChange(_doc: AvnacDocumentV1) {
  // autosave handled internally by useCanvasPersistence
}

function onEditorReady() {
  attachSmartObjectSelectionSync()
}

function isInfographicSmartObject(info: SelectedSmartObjectInfo | null): info is SelectedSmartObjectInfo {
  return info?.kind === 'infographic' && 'template' in info.data.source
}

function isDiagramSmartObject(info: SelectedSmartObjectInfo | null): info is SelectedSmartObjectInfo {
  return !!info && (info.kind === 'flowchart' || info.kind === 'organogram') && 'nodes' in info.data.source
}

async function openSelectedSmartObjectInPanel(panel: 'infographics' | 'diagrams') {
  const info = await editorRef.value?.runCommand<void, SelectedSmartObjectInfo | null>('smartObjects.getSelected') ?? null
  suppressSmartStoreRender = true
  try {
    if (panel === 'infographics' && isInfographicSmartObject(info)) {
      infographicsStore.openEditor(info.id, cloneAvnacPlain(info.data.source as AvnacInfographicData))
    } else if (panel === 'diagrams' && isDiagramSmartObject(info)) {
      diagramsStore.openEditor(info.id, cloneAvnacPlain(info.data.source as AvnacDiagramData))
    }
  } finally {
    queueMicrotask(() => {
      suppressSmartStoreRender = false
    })
  }
}

function attachSmartObjectSelectionSync() {
  const canvas = getCanvas()
  if (!canvas) return
  const refresh = () => {
    void refreshSmartObjectSelection()
  }
  canvas.on('selection:created', refresh)
  canvas.on('selection:updated', refresh)
  canvas.on('selection:cleared', refresh)
  canvas.on('avnac:smart-object:changed' as never, onSmartObjectChanged as never)
  refresh()
}

async function refreshSmartObjectSelection() {
  const info = await editorRef.value?.runCommand<void, SelectedSmartObjectInfo | null>('smartObjects.getSelected') ?? null
  smartObjectSelected.value = !!info
}

function onSmartObjectChanged(event: { id?: string; data?: AvnacSmartObjectData }) {
  if (!event.id || !event.data) return
  suppressSmartStoreRender = true
  try {
    if (event.id === infographicsStore.editingId && 'items' in event.data.source) {
      infographicsStore.updateData(cloneAvnacPlain(event.data.source as AvnacInfographicData))
    } else if (event.id === diagramsStore.editingId && 'nodes' in event.data.source) {
      diagramsStore.updateData(cloneAvnacPlain(event.data.source as AvnacDiagramData))
    }
  } finally {
    queueMicrotask(() => {
      suppressSmartStoreRender = false
    })
  }
}

// Shape tools delegation
function onShapePick(kind: string) {
  if (kind === 'line' || kind === 'arrow') {
    editorRef.value?.shapeTools.startLineDrawMode(kind)
    return
  }
  editorRef.value?.shapeTools.addShapeByKind(kind)
}

function onLinePick(kind: 'line' | 'curved-line' | 'connector') {
  editorRef.value?.shapeTools.startLineDrawMode(kind)
}

function onAddText() {
  editorRef.value?.shapeTools.addText()
}

function onAddImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    editorRef.value?.shapeTools.addImageFromFile(file)
  }
  input.click()
}

async function onAddImageFromUrl(opts: { url: string; origin: 'center'; width: number; height: number }) {
  const image = await (editorRef.value?.shapeTools.addImageFromUrl(opts) ?? Promise.resolve(null))
  return image ? true : null
}

// Paint/toolbar event delegation to fabricCanvas
function getCanvas() {
  // fabricCanvas is exposed as a ShallowRef but Vue unwraps it; cast accordingly
  const fc = editorRef.value?.fabricCanvas
  if (!fc) return null
  return (fc as any).value ?? (fc as any) ?? null
}

function commitObjectModified(canvas: any, obj: any) {
  obj?.set?.('dirty', true)
  obj?.setCoords?.()
  canvas.fire?.('object:modified', { target: obj })
}

function onPaintChange(v: BgValue) {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject()
  if (!active) return
  import('#/lib/avnac-fill-paint').then(({ applyBgValueToFill }) => {
    import('fabric').then((mod) => {
      applyBgValueToFill(mod, active, v)
      canvas.requestRenderAll()
      canvasStore.selectedPaint = v
      commitObjectModified(canvas, active)
    })
  })
}

function onTextFormatChange(partial: Partial<TextFormatToolbarValues>) {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject() as any
  if (!active) return
  if (canvasStore.textToolbarValues) {
    canvasStore.textToolbarValues = { ...canvasStore.textToolbarValues, ...partial }
  }
  import('fabric').then((mod) => {
    void applyTextFormatChange(mod, canvas, active, partial).then(() => syncActiveSmartText())
  })
}

async function syncActiveSmartText() {
  await editorRef.value?.runCommand('smartObjects.syncSelectedText')
}

function onShapePaintChange(v: BgValue) {
  onPaintChange(v)
}

function onCornerRadiusChange(v: number) {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject() as any
  if (!active) return
  import('#/lib/fabric-corner-radius').then(({ setSceneCornerRadiusOnRect }) => {
    setSceneCornerRadiusOnRect(active, v)
    canvas.requestRenderAll()
    commitObjectModified(canvas, active)
  })
}

function onImageCornerRadiusChange(v: number) {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject() as any
  if (!active) return
  import('#/lib/fabric-corner-radius').then(({ setSceneCornerRadiusOnImage }) => {
    import('fabric').then((mod) => {
      setSceneCornerRadiusOnImage(active, v, mod)
      canvas.requestRenderAll()
      commitObjectModified(canvas, active)
    })
  })
}

function onImageMaskChange(kind: ImageMaskKind) {
  const canvas = getCanvas()
  if (!canvas || !kind) return
  const active = canvas.getActiveObject() as any
  if (!active) return
  import('fabric').then((mod) => {
    if (!(active instanceof mod.FabricImage)) return
    applyFabricImageMask(active, mod, kind)
    canvas.requestRenderAll()
    commitObjectModified(canvas, active)
  })
}

function onCropImage() {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject() as any
  if (!active?.getSrc) return
  const crop = getFabricImageSourceCrop(active)
  cropImageSrc.value = active.getSrc()
  cropInitial.value = { x: crop.cropX, y: crop.cropY, w: crop.width, h: crop.height }
  cropModalOpen.value = true
}

function onApplyImageCrop(rect: { cropX: number; cropY: number; width: number; height: number }) {
  const canvas = getCanvas()
  const active = canvas?.getActiveObject() as any
  if (!canvas || !active) return
  import('fabric').then((mod) => {
    if (!(active instanceof mod.FabricImage)) return
    const radius = canvasStore.imageCornerToolbar?.radius ?? 0
    applyFabricImageSourceCrop(active, rect, mod, radius)
    canvas.requestRenderAll()
    commitObjectModified(canvas, active)
  })
  cropModalOpen.value = false
}

function updateActiveLine(partial: {
  arrowPathType?: ArrowPathType
  arrowHead?: number
  arrowHeadType?: ArrowHeadType
  arrowLineStyle?: ArrowLineStyle
}) {
  const canvas = getCanvas()
  const active = canvas?.getActiveObject() as any
  if (!canvas || !active) return
  import('fabric').then((mod) => {
    if (!(active instanceof mod.Group)) return
    const meta = getAvnacShapeMeta(active)
    if (!meta?.arrowEndpoints || (meta.kind !== 'line' && meta.kind !== 'arrow')) return
    const nextHeadType = partial.arrowHeadType ?? avnacStrokeLineHeadType(meta)
    const nextHead = partial.arrowHead ?? (isArrowHeadVisible(nextHeadType, meta.arrowHead) ? (meta.arrowHead ?? 1) || 1 : 0)
    const nextMeta = {
      ...meta,
      ...partial,
      kind: isArrowHeadVisible(nextHeadType, nextHead) ? 'arrow' as const : 'line' as const,
      arrowHead: nextHead,
      arrowHeadType: nextHeadType,
    }
    const stroke = getAvnacStroke(active)
    const color = stroke?.type === 'solid' ? stroke.color : arrowDisplayColor(active)
    layoutArrowGroup(active, meta.arrowEndpoints.x1, meta.arrowEndpoints.y1, meta.arrowEndpoints.x2, meta.arrowEndpoints.y2, {
      strokeWidth: nextMeta.arrowStrokeWidth ?? 6,
      headFrac: nextHead,
      headType: nextHeadType,
      color,
      lineStyle: nextMeta.arrowLineStyle,
      roundedEnds: nextMeta.arrowRoundedEnds,
      pathType: nextMeta.arrowPathType,
      curveBulge: nextMeta.arrowCurveBulge,
      curveT: nextMeta.arrowCurveT,
    })
    setAvnacShapeMeta(active, nextMeta)
    canvas.requestRenderAll()
    commitObjectModified(canvas, active)
  })
}

function onLinePathTypeChange(v: ArrowPathType) {
  updateActiveLine({ arrowPathType: v })
}

function onLineArrowHeadChange(v: ArrowHeadType) {
  updateActiveLine({ arrowHead: v === 'none' ? 0 : 1, arrowHeadType: v })
}

function onLineStyleChange(v: ArrowLineStyle) {
  updateActiveLine({ arrowLineStyle: v })
}

function onStrokeWidthChange(v: number) {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject()
  if (!active) return
  const targets = 'multiSelectionStacking' in active ? canvas.getActiveObjects() : [active]
  for (const o of targets) {
    o.set({ strokeWidth: v })
    o.set('dirty', true)
    o.setCoords()
    commitObjectModified(canvas, o)
  }
  canvas.requestRenderAll()
  canvasStore.selectionOutlineStrokeWidth = v
}

function onStrokePaintChange(v: BgValue) {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject()
  if (!active) return
  const targets = 'multiSelectionStacking' in active ? canvas.getActiveObjects() : [active]
  import('#/lib/avnac-fill-paint').then(({ applyBgValueToStroke }) => {
    import('fabric').then((mod) => {
      for (const o of targets) {
        applyBgValueToStroke(mod, o, v)
        commitObjectModified(canvas, o)
      }
      canvas.requestRenderAll()
      canvasStore.selectionOutlineStrokePaint = v
    })
  })
}

function onBlurChange(v: number) {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject()
  if (!active) return
  const clamped = Math.max(0, Math.min(100, Math.round(v)))
  if ('multiSelectionStacking' in active) {
    for (const o of canvas.getActiveObjects()) {
      o.set({ avnacBlur: clamped } as any)
      o.set('dirty', true)
      commitObjectModified(canvas, o)
    }
  } else {
    active.set({ avnacBlur: clamped } as any)
    active.set('dirty', true)
    commitObjectModified(canvas, active)
  }
  canvas.requestRenderAll()
  canvasStore.selectionBlurPct = v
}

function onOpacityChange(v: number) {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject()
  if (!active) return
  active.set('opacity', v / 100)
  canvas.requestRenderAll()
  canvasStore.selectionOpacityPct = v
  commitObjectModified(canvas, active)
}

function onShadowChange(v: FabricShadowUi) {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject()
  if (!active) return
  import('#/lib/avnac-fabric-shadow').then(({ buildFabricShadow }) => {
    import('fabric').then((mod) => {
      const sh = buildFabricShadow(mod, v)
      const targets = 'multiSelectionStacking' in active ? canvas.getActiveObjects() : [active]
      for (const o of targets) {
        o.set('shadow', sh)
        commitObjectModified(canvas, o)
      }
      canvas.requestRenderAll()
      canvasStore.selectionShadowUi = v
    })
  })
}

function onShadowToggle() {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject()
  if (!active) return
  const newActive = !canvasStore.selectionShadowActive
  import('#/lib/avnac-fabric-shadow').then(({ buildFabricShadow }) => {
    import('fabric').then((mod) => {
      const sh = newActive ? buildFabricShadow(mod, canvasStore.selectionShadowUi) : null
      const targets = 'multiSelectionStacking' in active ? canvas.getActiveObjects() : [active]
      for (const o of targets) {
        o.set('shadow', sh)
        commitObjectModified(canvas, o)
      }
      canvas.requestRenderAll()
      canvasStore.selectionShadowActive = newActive
    })
  })
}

async function onInsertChart(data: AvnacChartData) {
  const canvas = getCanvas()
  if (!canvas) return
  const doc = editorRef.value?.getDocument()
  const artW = doc?.artboard.width ?? 4000
  const artH = doc?.artboard.height ?? 2250
  const targetW = Math.min(1500, artW * 0.46)
  const targetH = Math.min(880, artH * 0.46)
  const [{ FabricImage }, { renderChartToDataUrl }] = await Promise.all([
    import('fabric'),
    import('#/composables/useChartRenderer'),
  ])
  const { url, pngW, pngH } = await renderChartToDataUrl(data, Math.round(targetW), Math.round(targetH))
  const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
  img.set({
    left: artW / 2,
    top: artH / 2,
    originX: 'center',
    originY: 'center',
    scaleX: targetW / pngW,
    scaleY: targetH / pngH,
    avnacChart: cloneAvnacPlain(data),
    avnacGroupKind: 'chart',
    avnacLayerName: 'Chart',
  } as any)
  const id = ensureAvnacLayerId(img)
  canvas.add(img)
  canvas.setActiveObject(img)
  canvas.requestRenderAll()
  chartsStore.openChartEditor(id, cloneAvnacPlain(data))
  activePanel.value = 'charts'
}

function findChartObject(id: string | null | undefined): any | null {
  const canvas = getCanvas()
  if (!canvas) return null
  const active = canvas.getActiveObject() as any
  if (active?.avnacChart && (!id || active.avnacLayerId === id || active.avnacGroupId === id)) return active
  const objects = canvas.getObjects?.() ?? []
  return objects.find((obj: any) => obj?.avnacChart && (!id || obj.avnacLayerId === id || obj.avnacGroupId === id)) ?? null
}

function openSelectedChartInPanel() {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject() as any
  if (!active?.avnacChart) return
  chartsStore.openChartEditor(active.avnacLayerId ?? 'chart', active.avnacChart)
}

// Re-render active chart image when user edits chart data in the panel/dialog.
watch(() => chartsStore.renderRev, async () => {
  const canvas = getCanvas()
  if (!canvas) return
  const data = chartsStore.editingChartData
  if (!data) return
  const active = findChartObject(chartsStore.editingChartId)
  if (!active?.avnacChart) return
  active.avnacChart = cloneAvnacPlain(data)
  // Render at the current DISPLAY size (intrinsic × scale), not the raw intrinsic size.
  // Chart.js forces devicePixelRatio:1 in useChartRenderer, so the PNG is exactly w×h.
  // After setSrc, Fabric updates width/height to the new PNG's natural size; we then
  // restore scaleX/scaleY so the on-canvas display size stays unchanged.
  const displayW = Math.max(200, Math.round((active.width ?? 400) * (active.scaleX ?? 1)))
  const displayH = Math.max(150, Math.round((active.height ?? 300) * (active.scaleY ?? 1)))
  const { renderChartToDataUrl } = await import('#/composables/useChartRenderer')
  const { url, pngW, pngH } = await renderChartToDataUrl(data, displayW, displayH)
  try {
    await active.setSrc?.(url, { crossOrigin: 'anonymous' })
  } catch (err) {
    console.warn('[avnac] chart re-render failed', err)
    active.set?.('src', url)
  }
  // pngW/pngH are the actual canvas dimensions after Chart.js renders (may differ from
  // displayW/displayH if DPR scaling occurs). Set scale so display stays displayW × displayH.
  active.set?.({
    scaleX: displayW / pngW,
    scaleY: displayH / pngH,
  })
  active.set?.('dirty', true)
  active.setCoords?.()
  canvas.requestRenderAll()
  commitObjectModified(canvas, active)
})

watch(() => infographicsStore.editingData, async (data) => {
  if (suppressSmartStoreRender || !data || !infographicsStore.editingId) return
  await editorRef.value?.runCommand('smartObjects.replace', {
    id: infographicsStore.editingId,
    data,
  })
}, { deep: true })

watch(() => diagramsStore.editingData, async (data) => {
  if (suppressSmartStoreRender || !data || !diagramsStore.editingId) return
  await editorRef.value?.runCommand('smartObjects.replace', {
    id: diagramsStore.editingId,
    data,
  })
}, { deep: true })

function onEditChartData() {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject() as any
  if (!active?.avnacChart) return
  chartsStore.openChartEditor(active.avnacLayerId ?? 'active', active.avnacChart)
  activePanel.value = 'charts'
}

function onDeleteSelected() {
  const canvas = getCanvas()
  if (!canvas) return
  import('#/lib/fabric-remove-selection').then(({ removeActiveObjectFromCanvas }) => {
    removeActiveObjectFromCanvas(canvas)
    canvas.requestRenderAll()
    canvasStore.clearSelection()
  })
}

async function onConvertSmartObject() {
  const count = await editorRef.value?.runCommand<void, number>('smartObjects.ungroupSelected') ?? 0
  if (count > 0) {
    smartObjectSelected.value = false
    infographicsStore.closeEditor()
    diagramsStore.closeEditor()
  }
}

function onBgChange(v: BgValue) {
  canvasStore.bgValue = v
}

// Layer panel operations
function onSelectLayer(stackIndex: number) {
  editorRef.value?.layerPanel.selectByIndex(stackIndex)
}

function onToggleVisible(stackIndex: number) {
  editorRef.value?.layerPanel.toggleVisible(stackIndex)
}

function onBringForward(stackIndex: number) {
  editorRef.value?.layerPanel.bringForward(stackIndex)
}

function onSendBackward(stackIndex: number) {
  editorRef.value?.layerPanel.sendBackward(stackIndex)
}

function onReorderLayers(fromIndex: number, toIndex: number) {
  // Convert from/to single indices to id-ordered array
  const lp = editorRef.value?.layerPanel
  if (!lp) return
  const rows = [...lp.layers.value]
  const [moved] = rows.splice(fromIndex, 1)
  rows.splice(toIndex, 0, moved)
  lp.reorderById(rows.map((r: any) => r.id as string))
}

function onRenameLayer(stackIndex: number, name: string) {
  editorRef.value?.layerPanel.renameLayer(stackIndex, name)
}

// PPTX export
async function onExportPptx() {
  const doc = editorRef.value?.getDocument()
  if (!doc) return
  await exportDocumentsToPptx([doc])
}

// PPTX import
async function onImportPptx() {
  try {
    const docs = await importPptxFromInput()
    if (docs.length > 0 && editorRef.value) {
      await editorRef.value.setDocument(docs[0])
    }
  } catch (err) {
    console.error('[avnac] PPTX import failed', err)
  }
}

// Insert infographic through the smart-objects plugin.
async function onInsertInfographic(data: AvnacInfographicData) {
  const result = await editorRef.value?.runCommand<unknown, SmartObjectInsertResult>(
    'smartObjects.insertInfographic',
    { data },
  )
  if (result) {
    suppressSmartStoreRender = true
    infographicsStore.openEditor(result.id, data)
    queueMicrotask(() => {
      suppressSmartStoreRender = false
    })
  }
}

// AI slide generation — load first doc into canvas; multi-slide ignored in standalone view
async function onAiGenerate(docs: AvnacDocumentV1[]) {
  if (!docs.length || !editorRef.value) return
  await editorRef.value.setDocument(docs[0])
  activePanel.value = null
}

// Template insert — replace current canvas content with the template doc
async function onTemplateInsert(doc: AvnacDocumentV1) {
  if (!editorRef.value) return
  await editorRef.value.setDocument(doc)
}

// Insert diagram through the smart-objects plugin.
async function onInsertDiagram(data: AvnacDiagramData) {
  const result = await editorRef.value?.runCommand<unknown, SmartObjectInsertResult>(
    'smartObjects.insertDiagram',
    { data },
  )
  if (result) {
    suppressSmartStoreRender = true
    diagramsStore.openEditor(result.id, data)
    queueMicrotask(() => {
      suppressSmartStoreRender = false
    })
  }
}
</script>

<style scoped>
.avnac-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border-radius: 6px;
  border: 1px solid var(--border-default, #e0e0e0);
  background: var(--surface-raised, #fff);
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: var(--fg-default, #262626);
}
.avnac-icon-btn:hover {
  background: var(--bg-subtle, #f0f0f0);
}
.avnac-side-panel {
  min-width: 260px;
  max-width: 320px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.avnac-editor-bottom-bar-content {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: none;
}
.avnac-editor-bottom-bar-content::-webkit-scrollbar {
  display: none;
}
.avnac-editor-bottom-bar-content > * {
  flex: 0 0 auto;
}

@media (max-width: 640px) {
  .avnac-editor-bottom-bar-content {
    justify-content: flex-start;
    gap: 6px;
    padding: 8px 6px;
  }
}
</style>
