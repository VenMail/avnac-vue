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
            <ChartDataPanel />
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
        <div class="flex items-center justify-center gap-4 p-3">
          <ShapesPopover @pick="onShapePick" />
          <button class="avnac-icon-btn" title="Add text" @click="onAddText">T</button>
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
    <ChartDataDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CanvasEditor from '#/components/canvas/CanvasEditor.vue'
import CanvasElementToolbar from '#/components/toolbar/CanvasElementToolbar.vue'
import EditorFloatingSidebar from '#/components/panels/EditorFloatingSidebar.vue'
import EditorLayersPanel from '#/components/panels/EditorLayersPanel.vue'
import ShapesPopover from '#/components/toolbar/ShapesPopover.vue'
import CanvasZoomSlider from '#/components/toolbar/CanvasZoomSlider.vue'
import PaintPopoverControl from '#/components/shared/PaintPopoverControl.vue'
import EditorImagesPanel from '#/components/panels/EditorImagesPanel.vue'
import EditorUploadsPanel from '#/components/panels/EditorUploadsPanel.vue'
import EditorAiPanel from '#/components/panels/EditorAiPanel.vue'
import EditorAppsPanel from '#/components/panels/EditorAppsPanel.vue'
import EditorAnimationPanel from '#/components/panels/EditorAnimationPanel.vue'
import ChartDataPanel from '#/components/charts/ChartDataPanel.vue'
import ChartDataDialog from '#/components/charts/ChartDataDialog.vue'
import InfographicPanel from '#/components/infographics/InfographicPanel.vue'
import DiagramPanel from '#/components/diagrams/DiagramPanel.vue'
import type { EditorLayerRow } from '#/components/panels/EditorLayersPanel.vue'
import type { EditorSidebarPanelId } from '#/lib/editor-sidebar-panel-layout'
import type { AvnacDocumentV1 } from '#/lib/avnac-document'
import type { BgValue } from '#/lib/bg-value'
import type { FabricShadowUi } from '#/lib/avnac-fabric-shadow'
import type { TextFormatToolbarValues } from '#/stores/canvas'
import { useCanvasStore } from '#/stores/canvas'
import { useChartsStore } from '#/stores/charts'
import { useInfographicsStore } from '#/stores/infographics'
import { useDiagramsStore } from '#/stores/diagrams'
import { exportDocumentsToPptx } from '#/pptx/export'
import { importPptxFromInput } from '#/pptx/import'
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
      infographicsStore.openEditor(info.id, structuredClone(info.data.source as AvnacInfographicData))
    } else if (panel === 'diagrams' && isDiagramSmartObject(info)) {
      diagramsStore.openEditor(info.id, structuredClone(info.data.source as AvnacDiagramData))
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
      infographicsStore.updateData(structuredClone(event.data.source as AvnacInfographicData))
    } else if (event.id === diagramsStore.editingId && 'nodes' in event.data.source) {
      diagramsStore.updateData(structuredClone(event.data.source as AvnacDiagramData))
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
    })
  })
}

function onTextFormatChange(partial: Partial<TextFormatToolbarValues>) {
  const canvas = getCanvas()
  if (!canvas) return
  const active = canvas.getActiveObject() as any
  if (!active) return

  if (partial.fontFamily !== undefined) active.set('fontFamily', partial.fontFamily)
  if (partial.fontSize !== undefined) active.set('fontSize', partial.fontSize)
  if (partial.bold !== undefined) active.set('fontWeight', partial.bold ? 'bold' : 'normal')
  if (partial.italic !== undefined) active.set('fontStyle', partial.italic ? 'italic' : 'normal')
  if (partial.underline !== undefined) active.set('underline', partial.underline)
  if (partial.textAlign !== undefined) active.set('textAlign', partial.textAlign)
  if (partial.lineHeight !== undefined) active.set('lineHeight', partial.lineHeight)
  if (canvasStore.textToolbarValues) {
    canvasStore.textToolbarValues = { ...canvasStore.textToolbarValues, ...partial }
  }
  if (partial.fillStyle !== undefined) {
    import('#/lib/avnac-fill-paint').then(({ applyBgValueToFill }) => {
      import('fabric').then((mod) => {
        applyBgValueToFill(mod, active, partial.fillStyle!)
        canvas.requestRenderAll()
        void syncActiveSmartText()
      })
    })
    return
  }
  canvas.requestRenderAll()
  void syncActiveSmartText()
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
    })
  })
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
    }
  } else {
    active.set({ avnacBlur: clamped } as any)
    active.set('dirty', true)
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
      for (const o of targets) o.set('shadow', sh)
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
      for (const o of targets) o.set('shadow', sh)
      canvas.requestRenderAll()
      canvasStore.selectionShadowActive = newActive
    })
  })
}

// Re-render active chart image when user saves edits in the chart data dialog.
watch(() => chartsStore.renderRev, async () => {
  const canvas = getCanvas()
  if (!canvas) return
  const data = chartsStore.editingChartData
  if (!data) return
  const active = canvas.getActiveObject() as any
  if (!active?.avnacChart) return
  active.avnacChart = data
  const w = (active.width ?? 400) * (active.scaleX ?? 1)
  const h = (active.height ?? 300) * (active.scaleY ?? 1)
  const { renderChartToDataUrl } = await import('#/composables/useChartRenderer')
  const url = await renderChartToDataUrl(data, Math.max(200, w), Math.max(150, h))
  await new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ;(active as any).setSrc?.(url, () => {
        active.set('dirty', true)
        canvas.requestRenderAll()
        resolve()
      })
    }
    img.onerror = reject
    img.src = url
  }).catch((err) => console.warn('[avnac] chart re-render failed', err))
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
</style>
