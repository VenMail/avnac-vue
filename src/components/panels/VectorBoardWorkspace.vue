<template>
  <div
    v-if="open"
    data-avnac-chrome
    class="pointer-events-auto fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-3 sm:p-6"
    role="dialog"
    aria-modal="true"
    :aria-label="boardName"
    @click.self="emit('close')"
  >
    <div
      class="flex h-[min(90vh,920px)] w-[min(96vw,1400px)] overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.2)]"
      @click.stop
    >
      <!-- Layers sidebar -->
      <aside class="flex w-[13.5rem] shrink-0 flex-col border-r border-black/[0.06] bg-neutral-50/90">
        <div class="border-b border-black/[0.06] px-3 py-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Layers</span>
        </div>
        <div class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto p-2">
          <div
            v-for="L in document.layers"
            :key="L.id"
            class="flex flex-col rounded-xl border px-2 py-1.5"
            :class="L.id === document.activeLayerId
              ? 'border-[var(--accent)]/60 bg-[var(--accent)]/15'
              : 'border-transparent bg-white/80'"
          >
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-black/[0.06]"
                :title="L.visible ? 'Hide' : 'Show'"
                :aria-label="L.visible ? 'Hide layer' : 'Show layer'"
                @click="setLayerVisible(L.id, !L.visible)"
              >
                <svg v-if="L.visible" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
              <button
                type="button"
                class="min-w-0 flex-1 truncate text-left text-[13px] font-medium text-neutral-800"
                @click="commitDoc({ ...document, activeLayerId: L.id })"
              >{{ L.name }}</button>
            </div>
            <div class="mt-1 flex items-center justify-end gap-0.5">
              <button type="button" class="rounded p-1 text-neutral-500 hover:bg-black/[0.06]" title="Move down" @click="moveLayer(L.id, -1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <button type="button" class="rounded p-1 text-neutral-500 hover:bg-black/[0.06]" title="Move up" @click="moveLayer(L.id, 1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="18 15 12 9 6 15"/></svg>
              </button>
              <button
                type="button"
                :disabled="document.layers.length <= 1"
                class="rounded p-1 text-neutral-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                title="Delete layer"
                @click="deleteLayer(L.id)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div class="border-t border-black/[0.06] p-2">
          <button
            type="button"
            class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-black/[0.08] bg-white py-2 text-[13px] font-medium text-neutral-800 hover:bg-black/[0.03]"
            @click="addLayer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add layer
          </button>
        </div>
      </aside>

      <!-- Main area -->
      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Title bar -->
        <div class="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3 sm:px-5">
          <h2 class="m-0 min-w-0 truncate text-base font-semibold text-neutral-900 sm:text-lg">{{ boardName }}</h2>
          <button type="button" class="vb-icon-btn" @click="emit('close')" aria-label="Close vector workspace">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Toolbar -->
        <div class="flex shrink-0 flex-col gap-2 border-b border-black/[0.06] bg-[linear-gradient(180deg,rgba(250,250,249,0.9)_0%,rgba(255,255,255,0.5)_100%)] px-4 py-3 sm:px-5">
          <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <!-- Drawing tools -->
              <div class="vb-toolbar-shell" role="toolbar" aria-label="Drawing tools">
                <div class="flex flex-wrap items-center gap-0.5 py-1 pl-1 pr-2">
                  <button v-for="t in TOOL_BUTTONS" :key="t.id" type="button" class="vb-icon-btn" :class="{ active: tool === t.id }" :title="t.label" :aria-pressed="tool === t.id" @click="setTool(t.id)">
                    <span v-html="t.icon" />
                  </button>
                </div>
              </div>
              <!-- Stroke + fill -->
              <div class="vb-toolbar-shell" role="toolbar" aria-label="Stroke and fill">
                <div class="flex flex-wrap items-center gap-0.5 py-1 pl-1 pr-2">
                  <label class="flex items-center gap-1.5 px-1 text-[12px] text-neutral-700 cursor-pointer">
                    <span>Stroke</span>
                    <input type="color" :value="strokeColor" @input="onStrokeColorInput" class="h-6 w-6 cursor-pointer rounded border border-black/[0.1] p-0" />
                  </label>
                  <label class="flex items-center gap-1 px-1 text-[12px] text-neutral-700 cursor-pointer">
                    <span>W</span>
                    <input type="range" min="0" max="16" :value="strokeWidthPx" @input="onStrokeWidthInput" class="w-16" />
                    <span class="w-5 text-right">{{ strokeWidthPx }}</span>
                  </label>
                  <template v-if="showFill">
                    <span class="mx-0.5 h-5 w-px bg-black/10" />
                    <label class="flex items-center gap-1.5 px-1 text-[12px] text-neutral-700 cursor-pointer">
                      <span>Fill</span>
                      <input type="color" :value="fillColorInput" @input="onFillColorInput" class="h-6 w-6 cursor-pointer rounded border border-black/[0.1] p-0" />
                    </label>
                  </template>
                </div>
              </div>
            </div>

            <!-- Board actions -->
            <div class="ml-auto flex shrink-0 items-center">
              <div class="vb-toolbar-shell" aria-label="Board actions">
                <div class="flex flex-wrap items-center justify-end gap-0.5 py-1 pl-1 pr-2">
                  <button type="button" class="vb-icon-btn wide px-2.5 text-[13px] font-medium" @click="clearActiveLayer">Clear layer</button>
                  <span class="mx-0.5 h-5 w-px bg-black/10" />
                  <button type="button" class="vb-icon-btn wide px-2.5 text-[13px] font-medium" @click="clearAll">Clear all</button>
                  <span class="mx-0.5 h-5 w-px bg-black/10" />
                  <div ref="saveSplitRef" class="relative shrink-0">
                    <div class="flex h-8 overflow-hidden rounded-lg">
                      <button type="button" class="flex min-w-0 flex-1 items-center justify-center bg-neutral-900 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-800" @click="onSaveClick">Save</button>
                      <button type="button" class="flex w-8 shrink-0 items-center justify-center border-l border-white/20 bg-neutral-900 text-white transition-colors hover:bg-neutral-800" :aria-expanded="saveSplitOpen" title="More save options" @click="saveSplitOpen = !saveSplitOpen">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>
                    <div v-if="saveSplitOpen" class="absolute right-0 top-full z-[80] mt-1 min-w-[14rem] rounded-xl border border-black/[0.08] bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.12)]" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        :disabled="!canPlace"
                        class="flex w-full px-3 py-2 text-left text-[13px] font-medium transition-colors"
                        :class="canPlace ? 'text-neutral-800 hover:bg-black/[0.05]' : 'cursor-not-allowed text-neutral-400'"
                        @click="onSaveAndPlaceClick"
                      >
                        Save and place on canvas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Canvas area -->
        <div ref="wrapRef" class="relative min-h-0 flex-1 bg-neutral-200/40 p-3 sm:p-4">
          <canvas
            ref="canvasRef"
            class="block h-full w-full max-w-none touch-none rounded-lg border border-black/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
            aria-label="Vector drawing canvas"
            style="touch-action: none"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @dblclick="onDblClick"
            @pointerleave="onPointerLeave"
          />
          <!-- Zoom indicator -->
          <div class="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-md border border-black/[0.08] bg-white/90 px-2 py-1 text-[11px] font-medium text-neutral-600 shadow-sm backdrop-blur-sm">
            {{ Math.round(viewScale * 100) }}%
          </div>
          <!-- Zoom controls -->
          <div class="pointer-events-auto absolute bottom-3 left-3 flex items-center gap-1 rounded-md border border-black/[0.08] bg-white/90 px-1 py-1 text-[11px] text-neutral-600 shadow-sm backdrop-blur-sm">
            <button type="button" class="rounded px-1.5 py-0.5 hover:bg-black/[0.06]" title="Zoom out" @click="zoomAtCenter(1 / 1.2)">−</button>
            <button type="button" class="rounded px-1.5 py-0.5 hover:bg-black/[0.06]" title="Reset zoom" @click="resetView">1:1</button>
            <button type="button" class="rounded px-1.5 py-0.5 hover:bg-black/[0.06]" title="Fit to content" @click="fitView">Fit</button>
            <button type="button" class="rounded px-1.5 py-0.5 hover:bg-black/[0.06]" title="Zoom in" @click="zoomAtCenter(1.2)">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref, computed, watch, watchEffect, onMounted, onBeforeUnmount, nextTick,
} from 'vue'
import {
  applySmoothPlacementHandles,
  ctrlInAbs,
  ctrlOutAbs,
  findNearestPointOnPenPath,
  splitPenBezierSegment,
  type VectorPenAnchor,
} from '#/lib/avnac-vector-pen-bezier'
import {
  appendClonedStrokesToActiveLayer,
  applyScaleStrokesInDoc,
  applyTranslateStrokesInDoc,
  applyZOrderInDoc,
  createVectorBoardLayer,
  duplicateSelectionsInPlace,
  emptyVectorBoardDocument,
  findStrokesIntersectingRect,
  findTopStrokeAt,
  getActiveLayer,
  getStrokesForSelections,
  normBoundsForSelections,
  parseVectorStrokeClipboardText,
  removeStrokesFromDoc,
  updateStrokeInDocFull,
  updateVectorStrokeInDoc,
  vectorDocHasRenderableStrokes,
  vectorStrokeOutlineIsVisible,
  type DocStrokeSelection,
  type VectorBoardDocument,
  type VectorBoardStroke,
  type VectorStrokeKind,
} from '#/lib/avnac-vector-board-document'

// ─── Constants ────────────────────────────────────────────────────────────────
const VECTOR_CLIPBOARD_PASTE_OFFSET_N = 0.02
const GRID_STEP = 24
const POINT_EPS = 0.002
const DRAFT_SHAPE_EDGE = 'rgba(15,23,42,0.32)'
const PEN_HIT_R = 0.017
const PEN_HIT_R_SQ = PEN_HIT_R * PEN_HIT_R
const PEN_CORNER_DRAG = 0.005

// ─── Props & emits ────────────────────────────────────────────────────────────
const props = defineProps<{
  open: boolean
  boardName: string
  document: VectorBoardDocument
  onSave: () => void
  onSaveAndPlace: () => void
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'change', doc: VectorBoardDocument): void
}>()

// ─── Types ────────────────────────────────────────────────────────────────────
type DrawTool = 'move' | 'pencil' | 'pen' | 'rect' | 'ellipse'
type ResizeHandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
type MarqueeRect = { minX: number; minY: number; maxX: number; maxY: number }
type PenBezierDrag =
  | { type: 'place'; anchorIndex: number; startX: number; startY: number }
  | { type: 'handle'; anchorIndex: number; which: 'in' | 'out' }
type PenBezierDraftState = {
  kind: 'pen-bezier'; anchors: VectorPenAnchor[]
  selectedAnchor: number | null; drag: PenBezierDrag | null
}
type PolylineDraftState = { kind: 'polyline'; tool: 'pencil'; points: [number, number][] }
type ShapeDraft = { kind: 'shape'; tool: 'rect' | 'ellipse'; a: [number, number]; b?: [number, number] }
type DraftState = PolylineDraftState | PenBezierDraftState | ShapeDraft

const RESIZE_HANDLE_IDS: ResizeHandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const RESIZE_HANDLE_CURSORS: Record<ResizeHandleId, string> = {
  nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
  se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize',
}

// ─── DOM refs ────────────────────────────────────────────────────────────────
const wrapRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const saveSplitRef = ref<HTMLDivElement | null>(null)

// ─── State ────────────────────────────────────────────────────────────────────
const tool = ref<DrawTool>('pencil')
const strokeColor = ref('#1a1a1a')
const fillColor = ref('#94a3b8')
const strokeWidthPx = ref(0)
const draft = ref<DraftState | null>(null)
const draftMut = { current: null as DraftState | null }
const penRemoveHintIndex = ref<number | null>(null)
const penCloseHover = ref(false)
const docSelection = ref<DocStrokeSelection[]>([])
const marqueeRect = ref<MarqueeRect | null>(null)
const saveSplitOpen = ref(false)

const viewScale = ref(1)
const viewTx = ref(0)
const viewTy = ref(0)
const viewMut = { scale: 1, tx: 0, ty: 0 }

const documentMut = { current: props.document }

// Mutable drag refs (not reactive — updated during pointer capture)
const moveDrag: { current: { selections: DocStrokeSelection[]; last: [number, number]; pointerId: number } | null } = { current: null }
const marqueeDrag: { current: { start: [number, number]; current: [number, number]; baseSelection: DocStrokeSelection[]; additive: boolean; pointerId: number } | null } = { current: null }
const resizeDrag: { current: { handle: ResizeHandleId; snapshotDoc: VectorBoardDocument; snapshotSelections: DocStrokeSelection[]; bounds: { minX: number; minY: number; maxX: number; maxY: number }; anchor: [number, number]; startPt: [number, number]; pointerId: number } | null } = { current: null }
const penEditDrag: { current: { type: 'anchor' | 'handle-in' | 'handle-out'; anchorIndex: number; pointerId: number; last: [number, number] } | null } = { current: null }
const panDrag: { current: { startX: number; startY: number; startTx: number; startTy: number; pointerId: number } | null } = { current: null }
const history: { stack: VectorBoardDocument[]; index: number } = { stack: [props.document], index: 0 }
const spaceDown = { current: false }
const lastCanvasPointerClient: { current: { x: number; y: number } | null } = { current: null }
const altKeyHeld = { current: false }

const penEditSelection = ref<DocStrokeSelection | null>(null)
const penEditSelectionMut = { current: null as DocStrokeSelection | null }
const penEditAddHint = ref<{ x: number; y: number; segmentIndex: number; t: number } | null>(null)
const penEditAddHintMut = { current: null as typeof penEditAddHint.value }

// ─── Computed ─────────────────────────────────────────────────────────────────
const primarySelection = computed(() =>
  docSelection.value.length > 0 ? docSelection.value[docSelection.value.length - 1]! : null,
)

const selectedStrokeForUi = computed(() => {
  const ps = primarySelection.value
  if (!ps) return null
  const layer = props.document.layers.find((l) => l.id === ps.layerId)
  return layer?.strokes.find((s) => s.id === ps.strokeId) ?? null
})

const showFill = computed(() => {
  const t = tool.value
  if (t === 'rect' || t === 'ellipse' || t === 'pen') return true
  if (t === 'move') {
    const s = selectedStrokeForUi.value
    return !!(s && (s.kind === 'rect' || s.kind === 'ellipse' || s.kind === 'polygon' || (s.kind === 'pen' && s.penClosed === true)))
  }
  return false
})

const canPlace = computed(() => vectorDocHasRenderableStrokes(props.document))

// fillColorInput: never empty so color input doesn't go white
const fillColorInput = computed(() => fillColor.value && fillColor.value !== 'transparent' ? fillColor.value : '#94a3b8')

const TOOL_BUTTONS = [
  { id: 'move' as DrawTool, label: 'Move (V)', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M5 3l14 9-14 9V3z"/></svg>' },
  { id: 'pencil' as DrawTool, label: 'Pencil (Shift+P)', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' },
  { id: 'pen' as DrawTool, label: 'Pen (P)', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>' },
  { id: 'rect' as DrawTool, label: 'Rectangle (R)', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>' },
  { id: 'ellipse' as DrawTool, label: 'Ellipse (O)', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><ellipse cx="12" cy="12" rx="10" ry="6"/></svg>' },
]

// ─── Pure drawing functions (framework-agnostic) ───────────────────────────────
function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f8f8f7'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(10,10,10,0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= w; x += GRID_STEP) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h) }
  for (let y = 0; y <= h; y += GRID_STEP) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5) }
  ctx.stroke()
}

function tracePenBezierPath(ctx: CanvasRenderingContext2D, anchors: VectorPenAnchor[], w: number, h: number, closed: boolean) {
  if (anchors.length < 2) return
  ctx.moveTo(anchors[0]!.x * w, anchors[0]!.y * h)
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i]!; const b = anchors[i + 1]!
    const [x1, y1] = ctrlOutAbs(a); const [x2, y2] = ctrlInAbs(b)
    ctx.bezierCurveTo(x1 * w, y1 * h, x2 * w, y2 * h, b.x * w, b.y * h)
  }
  if (closed && anchors.length >= 2) {
    const last = anchors[anchors.length - 1]!; const first = anchors[0]!
    const [lx1, ly1] = ctrlOutAbs(last); const [lx2, ly2] = ctrlInAbs(first)
    ctx.bezierCurveTo(lx1 * w, ly1 * h, lx2 * w, ly2 * h, first.x * w, first.y * h)
  }
}

function paintHandleDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const s = 4
  ctx.fillStyle = '#2563eb'; ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s, cy)
  ctx.closePath(); ctx.fill(); ctx.stroke()
}

function paintPenBezierDraft(ctx: CanvasRenderingContext2D, d: PenBezierDraftState, w: number, h: number, sColor: string, swPx: number, fColor: string, removeHintIndex: number | null, closeHover: boolean, vs: number) {
  const { anchors, selectedAnchor } = d
  if (anchors.length >= 2) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (closeHover && fColor && fColor !== 'transparent' && anchors.length >= 3) {
      ctx.beginPath(); tracePenBezierPath(ctx, anchors, w, h, true)
      ctx.fillStyle = fColor; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1
    }
    ctx.beginPath(); tracePenBezierPath(ctx, anchors, w, h, false)
    if (swPx > 0) { ctx.strokeStyle = sColor; ctx.lineWidth = swPx }
    else { ctx.strokeStyle = 'rgba(71,85,105,0.82)'; ctx.lineWidth = Math.max(0.75, 1 / Math.max(0.001, vs)) }
    ctx.stroke()
  }
  if (closeHover && anchors.length >= 2) {
    const last = anchors[anchors.length - 1]!; const first = anchors[0]!
    ctx.save(); ctx.strokeStyle = 'rgba(37,99,235,0.9)'; ctx.lineWidth = Math.max(1, swPx || 1)
    ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(last.x * w, last.y * h)
    const [cx1, cy1] = ctrlOutAbs(last); const [cx2, cy2] = ctrlInAbs(first)
    ctx.bezierCurveTo(cx1 * w, cy1 * h, cx2 * w, cy2 * h, first.x * w, first.y * h)
    ctx.stroke(); ctx.restore()
  }
  const ax = (x: number) => x * w; const ay = (y: number) => y * h
  for (let i = 0; i < anchors.length; i++) {
    const p = anchors[i]!
    if (p.inX != null && p.inY != null) {
      ctx.strokeStyle = 'rgba(100,116,139,0.9)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(ax(p.x), ay(p.y)); ctx.lineTo(ax(p.inX), ay(p.inY)); ctx.stroke()
      paintHandleDiamond(ctx, ax(p.inX), ay(p.inY))
    }
    if (p.outX != null && p.outY != null) {
      ctx.strokeStyle = 'rgba(100,116,139,0.9)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(ax(p.x), ay(p.y)); ctx.lineTo(ax(p.outX), ay(p.outY)); ctx.stroke()
      paintHandleDiamond(ctx, ax(p.outX), ay(p.outY))
    }
    const r = selectedAnchor === i ? 5 : 4
    ctx.fillStyle = selectedAnchor === i ? '#2563eb' : '#ffffff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(ax(p.x), ay(p.y), r, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    if (removeHintIndex === i) {
      const k = 6; ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.75
      ctx.beginPath()
      ctx.moveTo(ax(p.x) - k, ay(p.y) - k); ctx.lineTo(ax(p.x) + k, ay(p.y) + k)
      ctx.moveTo(ax(p.x) + k, ay(p.y) - k); ctx.lineTo(ax(p.x) - k, ay(p.y) + k)
      ctx.stroke()
    }
  }
}

function paintStroke(ctx: CanvasRenderingContext2D, s: VectorBoardStroke, w: number, h: number) {
  const m = Math.max(1, Math.min(w, h))
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const hasFill = s.fill && s.fill.length > 0 && s.fill !== 'transparent'
  const drawStroke = vectorStrokeOutlineIsVisible(s)
  if (drawStroke) { ctx.strokeStyle = s.stroke; ctx.lineWidth = Math.max(0, s.strokeWidthN * m) }
  if (s.kind === 'pen') {
    if (s.penAnchors && s.penAnchors.length >= 2) {
      ctx.beginPath(); ctx.moveTo(s.penAnchors[0]!.x * w, s.penAnchors[0]!.y * h)
      for (let i = 0; i < s.penAnchors.length - 1; i++) {
        const a = s.penAnchors[i]!; const b = s.penAnchors[i + 1]!
        const [x1, y1] = ctrlOutAbs(a); const [x2, y2] = ctrlInAbs(b)
        ctx.bezierCurveTo(x1 * w, y1 * h, x2 * w, y2 * h, b.x * w, b.y * h)
      }
      if (s.penClosed) {
        const last = s.penAnchors[s.penAnchors.length - 1]!; const first = s.penAnchors[0]!
        const [lx1, ly1] = ctrlOutAbs(last); const [lx2, ly2] = ctrlInAbs(first)
        ctx.bezierCurveTo(lx1 * w, ly1 * h, lx2 * w, ly2 * h, first.x * w, first.y * h)
        if (hasFill) { ctx.fillStyle = s.fill; ctx.fill() }
      }
      if (drawStroke) ctx.stroke()
    } else if (s.points.length >= 2) {
      ctx.beginPath(); ctx.moveTo(s.points[0]![0] * w, s.points[0]![1] * h)
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i]![0] * w, s.points[i]![1] * h)
      if (drawStroke) ctx.stroke()
    }
    return
  }
  if (s.points.length < 2) return
  const [pax, pay] = s.points[0]!; const [pbx, pby] = s.points[1]!
  const x0 = pax * w; const y0 = pay * h; const x1 = pbx * w; const y1 = pby * h
  if (s.kind === 'line') { if (!drawStroke) return; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); return }
  if (s.kind === 'rect') {
    const minX = Math.min(x0, x1); const maxX = Math.max(x0, x1)
    const minY = Math.min(y0, y1); const maxY = Math.max(y0, y1)
    ctx.beginPath(); ctx.rect(minX, minY, maxX - minX, maxY - minY)
    if (hasFill) { ctx.fillStyle = s.fill; ctx.fill() }; if (drawStroke) ctx.stroke(); return
  }
  if (s.kind === 'ellipse') {
    const minX = Math.min(pax, pbx); const maxX = Math.max(pax, pbx)
    const minY = Math.min(pay, pby); const maxY = Math.max(pay, pby)
    const cx = ((minX + maxX) / 2) * w; const cy = ((minY + maxY) / 2) * h
    const rx = ((maxX - minX) / 2) * w; const ry = ((maxY - minY) / 2) * h
    if (rx < 0.5 || ry < 0.5) return
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    if (hasFill) { ctx.fillStyle = s.fill; ctx.fill() }; if (drawStroke) ctx.stroke(); return
  }
  if (s.kind === 'arrow') {
    if (!drawStroke) return
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
    let dx = x1 - x0; let dy = y1 - y0; const len = Math.hypot(dx, dy)
    if (len < 2) return; dx /= len; dy /= len
    const head = Math.min(len * 0.35, 28); const wing = head * 0.45
    const bx0 = x1 - dx * head; const by0 = y1 - dy * head
    const px = -dy; const py = dx
    ctx.beginPath()
    ctx.moveTo(x1, y1); ctx.lineTo(bx0 + px * wing, by0 + py * wing)
    ctx.moveTo(x1, y1); ctx.lineTo(bx0 - px * wing, by0 - py * wing)
    ctx.stroke()
  }
}

function paintDocument(ctx: CanvasRenderingContext2D, doc: VectorBoardDocument, w: number, h: number) {
  for (const layer of doc.layers) {
    if (!layer.visible) continue
    for (const s of layer.strokes) paintStroke(ctx, s, w, h)
  }
}

function paintDraft(ctx: CanvasRenderingContext2D, d: DraftState | null, w: number, h: number, sColor: string, swPx: number, fColor: string, removeHintIndex: number | null, closeHover: boolean, vs: number) {
  if (!d) return
  if (d.kind === 'pen-bezier') { paintPenBezierDraft(ctx, d, w, h, sColor, swPx, fColor, removeHintIndex, closeHover, vs); return }
  if (d.kind === 'polyline') {
    const baseLw = Math.max(0, swPx); if (baseLw <= 0) return
    ctx.strokeStyle = sColor; ctx.lineWidth = baseLw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (d.points.length < 2) return
    ctx.beginPath(); ctx.moveTo(d.points[0]![0] * w, d.points[0]![1] * h)
    for (let i = 1; i < d.points.length; i++) ctx.lineTo(d.points[i]![0] * w, d.points[i]![1] * h)
    ctx.stroke(); return
  }
  const sh = d; const baseLw = Math.max(0, swPx); const guideLw = baseLw > 0 ? baseLw : 1
  ctx.strokeStyle = sColor; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const b = sh.b ?? sh.a
  const qx0 = sh.a[0] * w; const qy0 = sh.a[1] * h; const qx1 = b[0] * w; const qy1 = b[1] * h
  if (sh.tool === 'rect') {
    const minX = Math.min(qx0, qx1); const maxX = Math.max(qx0, qx1)
    const minY = Math.min(qy0, qy1); const maxY = Math.max(qy0, qy1)
    ctx.beginPath(); ctx.rect(minX, minY, maxX - minX, maxY - minY)
    if (fColor && fColor !== 'transparent') { ctx.fillStyle = fColor; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1 }
    ctx.lineWidth = guideLw; ctx.strokeStyle = DRAFT_SHAPE_EDGE; ctx.stroke(); return
  }
  if (sh.tool === 'ellipse') {
    const minX = Math.min(sh.a[0], b[0]); const maxX = Math.max(sh.a[0], b[0])
    const minY = Math.min(sh.a[1], b[1]); const maxY = Math.max(sh.a[1], b[1])
    const ecx = ((minX + maxX) / 2) * w; const ecy = ((minY + maxY) / 2) * h
    const erx = ((maxX - minX) / 2) * w; const ery = ((maxY - minY) / 2) * h
    if (erx < 0.5 || ery < 0.5) return
    ctx.beginPath(); ctx.ellipse(ecx, ecy, erx, ery, 0, 0, Math.PI * 2)
    if (fColor && fColor !== 'transparent') { ctx.fillStyle = fColor; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1 }
    ctx.lineWidth = guideLw; ctx.strokeStyle = DRAFT_SHAPE_EDGE; ctx.stroke()
  }
}

function paintMarqueeRect(ctx: CanvasRenderingContext2D, rect: MarqueeRect | null, w: number, h: number, vs: number) {
  if (!rect) return
  const rw = (rect.maxX - rect.minX) * w; const rh = (rect.maxY - rect.minY) * h
  if (rw <= 0 || rh <= 0) return
  ctx.save()
  ctx.fillStyle = 'rgba(37,99,235,0.08)'; ctx.strokeStyle = 'rgba(37,99,235,0.75)'; ctx.lineWidth = 1 / vs
  ctx.fillRect(rect.minX * w, rect.minY * h, rw, rh)
  ctx.strokeRect(rect.minX * w, rect.minY * h, rw, rh)
  ctx.restore()
}

function paintTransformHandles(ctx: CanvasRenderingContext2D, bounds: { minX: number; minY: number; maxX: number; maxY: number } | null, w: number, h: number, vs: number) {
  if (!bounds) return
  const HR = 5 / vs
  ctx.strokeStyle = 'rgba(37,99,235,0.9)'; ctx.lineWidth = 1 / vs
  ctx.strokeRect(bounds.minX * w, bounds.minY * h, (bounds.maxX - bounds.minX) * w, (bounds.maxY - bounds.minY) * h)
  for (const id of RESIZE_HANDLE_IDS) {
    const [hx, hy] = handlePositionInBounds(id, bounds)
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1.5 / vs
    ctx.fillRect(hx * w - HR, hy * h - HR, HR * 2, HR * 2)
    ctx.strokeRect(hx * w - HR, hy * h - HR, HR * 2, HR * 2)
  }
}

function paintPenEditOverlay(
  ctx: CanvasRenderingContext2D,
  doc: VectorBoardDocument,
  sel: DocStrokeSelection | null,
  w: number,
  h: number,
  vs: number,
  addHint: { x: number; y: number; segmentIndex: number; t: number } | null,
) {
  if (!sel) return
  const layer = doc.layers.find((l) => l.id === sel.layerId)
  const stroke = layer?.strokes.find((s) => s.id === sel.strokeId)
  if (!stroke || stroke.kind !== 'pen' || !stroke.penAnchors || stroke.penAnchors.length < 2) return
  const anchors = stroke.penAnchors
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(37,99,235,0.5)'
  ctx.lineWidth = Math.max(0.75, 1 / Math.max(0.001, vs))
  tracePenBezierPath(ctx, anchors, w, h, stroke.penClosed === true)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(37,99,235,0.5)'; ctx.lineWidth = 1 / vs
  for (const a of anchors) {
    if (a.inX != null && a.inY != null) { ctx.beginPath(); ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(a.inX * w, a.inY * h); ctx.stroke() }
    if (a.outX != null && a.outY != null) { ctx.beginPath(); ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(a.outX * w, a.outY * h); ctx.stroke() }
  }
  const r = 3 / vs
  for (const a of anchors) {
    if (a.inX != null && a.inY != null) { ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.arc(a.inX * w, a.inY * h, r, 0, Math.PI * 2); ctx.fill() }
    if (a.outX != null && a.outY != null) { ctx.fillStyle = '#2563eb'; ctx.beginPath(); ctx.arc(a.outX * w, a.outY * h, r, 0, Math.PI * 2); ctx.fill() }
  }
  const sz = 6 / vs; const half = sz / 2
  for (const a of anchors) {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1 / vs
    ctx.fillRect(a.x * w - half, a.y * h - half, sz, sz); ctx.strokeRect(a.x * w - half, a.y * h - half, sz, sz)
  }
  if (addHint) {
    const hr = 4 / vs; ctx.beginPath(); ctx.arc(addHint.x * w, addHint.y * h, hr, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 1.25 / vs; ctx.strokeStyle = '#2563eb'; ctx.stroke()
  }
  ctx.restore()
}

// ─── Helper functions ─────────────────────────────────────────────────────────
function handlePositionInBounds(id: ResizeHandleId, b: { minX: number; minY: number; maxX: number; maxY: number }): [number, number] {
  const cx = (b.minX + b.maxX) / 2; const cy = (b.minY + b.maxY) / 2
  switch (id) {
    case 'nw': return [b.minX, b.minY]; case 'n': return [cx, b.minY]; case 'ne': return [b.maxX, b.minY]
    case 'e': return [b.maxX, cy]; case 'se': return [b.maxX, b.maxY]; case 's': return [cx, b.maxY]
    case 'sw': return [b.minX, b.maxY]; case 'w': return [b.minX, cy]
  }
}

function anchorForHandle(id: ResizeHandleId, b: { minX: number; minY: number; maxX: number; maxY: number }): [number, number] {
  switch (id) {
    case 'nw': return [b.maxX, b.maxY]; case 'n': return [(b.minX + b.maxX) / 2, b.maxY]; case 'ne': return [b.minX, b.maxY]
    case 'e': return [b.minX, (b.minY + b.maxY) / 2]; case 'se': return [b.minX, b.minY]
    case 's': return [(b.minX + b.maxX) / 2, b.minY]; case 'sw': return [b.maxX, b.minY]
    case 'w': return [b.maxX, (b.minY + b.maxY) / 2]
  }
}

function constrainShapeEnd(a: [number, number], pt: [number, number], w: number, h: number): [number, number] {
  const dxp = (pt[0] - a[0]) * w; const dyp = (pt[1] - a[1]) * h
  const m = Math.max(Math.abs(dxp), Math.abs(dyp))
  const sx = dxp < 0 ? -1 : 1; const sy = dyp < 0 ? -1 : 1
  return [a[0] + (sx * m) / Math.max(1, w), a[1] + (sy * m) / Math.max(1, h)]
}

function hitTestPenBezier(d: PenBezierDraftState, nx: number, ny: number): { type: 'handle'; anchorIndex: number; which: 'in' | 'out' } | { type: 'anchor'; anchorIndex: number } | null {
  for (let i = d.anchors.length - 1; i >= 0; i--) {
    const a = d.anchors[i]!
    if (a.outX != null && a.outY != null) { const dx = nx - a.outX; const dy = ny - a.outY; if (dx * dx + dy * dy <= PEN_HIT_R_SQ) return { type: 'handle', anchorIndex: i, which: 'out' } }
    if (a.inX != null && a.inY != null) { const dx = nx - a.inX; const dy = ny - a.inY; if (dx * dx + dy * dy <= PEN_HIT_R_SQ) return { type: 'handle', anchorIndex: i, which: 'in' } }
  }
  for (let i = d.anchors.length - 1; i >= 0; i--) {
    const a = d.anchors[i]!; const dx = nx - a.x; const dy = ny - a.y
    if (dx * dx + dy * dy <= PEN_HIT_R_SQ * 1.44) return { type: 'anchor', anchorIndex: i }
  }
  return null
}

function removePenAnchorAt(anchors: VectorPenAnchor[], idx: number): VectorPenAnchor[] {
  if (idx < 0 || idx >= anchors.length) return anchors
  const copy = anchors.map((a) => ({ ...a }))
  copy.splice(idx, 1)
  if (idx > 0) { const prev = copy[idx - 1]!; delete prev.outX; delete prev.outY }
  if (idx < copy.length) { const next = copy[idx]!; delete next.inX; delete next.inY }
  return copy
}

function pointerAltKey(e: PointerEvent | MouseEvent): boolean {
  return e.altKey || (typeof (e as any).getModifierState === 'function' && (e as any).getModifierState('Alt'))
}

function releasePointerIfCaptured(el: HTMLElement | null, pointerId: number) {
  if (!el || pointerId < 0) return
  try { if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId) } catch { /* ignore */ }
}

// ─── Canvas rendering ─────────────────────────────────────────────────────────
function paintFrame() {
  const wrap = wrapRef.value; const canvas = canvasRef.value
  if (!wrap || !canvas) return
  const dpr = window.devicePixelRatio || 1
  const { width, height } = wrap.getBoundingClientRect()
  const w = Math.max(1, Math.floor(width)); const h = Math.max(1, Math.floor(height))
  canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr)
  canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d'); if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.translate(viewTx.value, viewTy.value); ctx.scale(viewScale.value, viewScale.value)
  drawGrid(ctx, w, h)
  paintDocument(ctx, props.document, w, h)
  paintDraft(ctx, draftMut.current, w, h, strokeColor.value, strokeWidthPx.value, fillColor.value, penRemoveHintIndex.value, penCloseHover.value, viewScale.value)
  paintMarqueeRect(ctx, marqueeRect.value, w, h, viewScale.value)
  if (!penEditSelection.value && !draftMut.current) {
    const selBounds = normBoundsForSelections(props.document, docSelection.value)
    paintTransformHandles(ctx, selBounds, w, h, viewScale.value)
  }
  paintPenEditOverlay(ctx, props.document, penEditSelection.value, w, h, viewScale.value, penEditAddHintMut.current)
  ctx.restore()
}

// ─── Coordinate helpers ───────────────────────────────────────────────────────
function toNorm(clientX: number, clientY: number): [number, number] | null {
  const canvas = canvasRef.value; if (!canvas) return null
  const r = canvas.getBoundingClientRect()
  const worldX = (clientX - r.left - viewMut.tx) / viewMut.scale
  const worldY = (clientY - r.top - viewMut.ty) / viewMut.scale
  return [Math.max(0, Math.min(1, worldX / Math.max(1, r.width))), Math.max(0, Math.min(1, worldY / Math.max(1, r.height)))]
}

function toNormUnclamped(clientX: number, clientY: number): [number, number] | null {
  const canvas = canvasRef.value; if (!canvas) return null
  const r = canvas.getBoundingClientRect()
  return [(clientX - r.left - viewMut.tx) / viewMut.scale / Math.max(1, r.width), (clientY - r.top - viewMut.ty) / viewMut.scale / Math.max(1, r.height)]
}

// ─── Zoom/pan ─────────────────────────────────────────────────────────────────
function zoomAt(cx: number, cy: number, factor: number) {
  const nextScale = Math.max(0.2, Math.min(8, viewMut.scale * factor))
  if (Math.abs(nextScale - viewMut.scale) < 1e-6) return
  const worldX = (cx - viewMut.tx) / viewMut.scale; const worldY = (cy - viewMut.ty) / viewMut.scale
  viewScale.value = nextScale; viewTx.value = cx - worldX * nextScale; viewTy.value = cy - worldY * nextScale
}

function zoomAtCenter(factor: number) {
  const canvas = canvasRef.value; if (!canvas) return
  const r = canvas.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, factor)
}

function resetView() { viewScale.value = 1; viewTx.value = 0; viewTy.value = 0 }

function fitView() {
  const canvas = canvasRef.value; if (!canvas) return
  const r = canvas.getBoundingClientRect()
  const allSels = props.document.layers.flatMap((L) => L.visible ? L.strokes.map((s) => ({ layerId: L.id, strokeId: s.id })) : [])
  const b = normBoundsForSelections(props.document, allSels)
  if (!b) { resetView(); return }
  const pad = 0.05
  const minX = Math.max(0, b.minX - pad); const maxX = Math.min(1, b.maxX + pad)
  const minY = Math.max(0, b.minY - pad); const maxY = Math.min(1, b.maxY + pad)
  const worldW = (maxX - minX) * r.width; const worldH = (maxY - minY) * r.height
  if (worldW <= 0 || worldH <= 0) { resetView(); return }
  const nextScale = Math.max(0.2, Math.min(8, Math.min(r.width / worldW, r.height / worldH)))
  const ccx = ((minX + maxX) / 2) * r.width; const ccy = ((minY + maxY) / 2) * r.height
  viewScale.value = nextScale; viewTx.value = r.width / 2 - ccx * nextScale; viewTy.value = r.height / 2 - ccy * nextScale
}

// ─── History ──────────────────────────────────────────────────────────────────
function commitDoc(doc: VectorBoardDocument) {
  documentMut.current = doc
  const h = history; const truncated = h.stack.slice(0, h.index + 1); truncated.push(doc)
  const MAX = 200; const trimmed = truncated.length > MAX ? truncated.slice(truncated.length - MAX) : truncated
  history.stack = trimmed; history.index = trimmed.length - 1
  emit('change', doc)
}

function commitLive(doc: VectorBoardDocument) {
  documentMut.current = doc
  emit('change', doc)
}

function undoVector() {
  const h = history; if (h.index <= 0) return
  const nextIndex = h.index - 1; const doc = h.stack[nextIndex]!
  history.index = nextIndex; documentMut.current = doc
  docSelection.value = docSelection.value.filter((sel) => {
    const L = doc.layers.find((l) => l.id === sel.layerId)
    return L?.strokes.some((s) => s.id === sel.strokeId)
  })
  penEditSelection.value = null; emit('change', doc)
}

function redoVector() {
  const h = history; if (h.index >= h.stack.length - 1) return
  const nextIndex = h.index + 1; const doc = h.stack[nextIndex]!
  history.index = nextIndex; documentMut.current = doc
  docSelection.value = docSelection.value.filter((sel) => {
    const L = doc.layers.find((l) => l.id === sel.layerId)
    return L?.strokes.some((s) => s.id === sel.strokeId)
  })
  penEditSelection.value = null; emit('change', doc)
}

// ─── Stroke helpers ───────────────────────────────────────────────────────────
function strokeWidthNFromCanvas(): number {
  const canvas = canvasRef.value; if (!canvas) return 0
  const r = canvas.getBoundingClientRect()
  return strokeWidthPx.value / Math.max(1, Math.min(r.width, r.height))
}

function appendPoint(pts: [number, number][], p: [number, number]): [number, number][] {
  const last = pts[pts.length - 1]
  if (!last) return [...pts, p]
  const dx = p[0] - last[0]; const dy = p[1] - last[1]
  if (dx * dx + dy * dy < POINT_EPS * POINT_EPS) return pts
  return [...pts, p]
}

function getShapeFill(): string {
  const t = tool.value
  if (t === 'rect' || t === 'ellipse' || t === 'pen') return fillColor.value && fillColor.value !== 'transparent' ? fillColor.value : ''
  return ''
}

function commitStrokeToActiveLayer(stroke: VectorBoardStroke) {
  const active = getActiveLayer(props.document); if (!active) return
  commitDoc({
    ...props.document,
    layers: props.document.layers.map((L) => L.id !== active.id ? L : { ...L, strokes: [...L.strokes, stroke] }),
  })
  docSelection.value = [{ layerId: active.id, strokeId: stroke.id }]
  penEditSelection.value = null
}

function commitPenBezierDraft(closed = false) {
  const d = draftMut.current
  if (d?.kind !== 'pen-bezier' || d.anchors.length < 2) return
  const fill = closed && fillColor.value && fillColor.value !== 'transparent' ? fillColor.value : ''
  commitStrokeToActiveLayer({
    id: crypto.randomUUID(), kind: 'pen', points: [], penAnchors: d.anchors.map((q) => ({ ...q })),
    penClosed: closed ? true : undefined, stroke: strokeColor.value, strokeWidthN: strokeWidthNFromCanvas(), fill,
  })
  draftMut.current = null; draft.value = null; penRemoveHintIndex.value = null; penCloseHover.value = false
}

// ─── Pen hover cursor ─────────────────────────────────────────────────────────
function updatePenHoverCursor(clientX: number, clientY: number, altHeld: boolean) {
  const canvas = canvasRef.value; if (!canvas) return
  const penEdit = penEditSelectionMut.current
  if (tool.value === 'move' && penEdit) {
    if (penEditDrag.current) { penEditAddHintMut.current = null; penEditAddHint.value = null; return }
    const r = canvas.getBoundingClientRect()
    const ptu = toNormUnclamped(clientX, clientY)
    if (!ptu) { penEditAddHintMut.current = null; penEditAddHint.value = null; return }
    const layer = documentMut.current.layers.find((l) => l.id === penEdit.layerId)
    const stroke = layer?.strokes.find((s) => s.id === penEdit.strokeId)
    if (!stroke?.penAnchors || stroke.penAnchors.length < 2) { penEditAddHintMut.current = null; penEditAddHint.value = null; return }
    const hitR = 8 / (viewMut.scale * Math.min(r.width, r.height)); const hitR2 = hitR * hitR
    for (const a of stroke.penAnchors) {
      const dx = ptu[0] - a.x; const dy = ptu[1] - a.y
      if (dx * dx + dy * dy <= hitR2) { penEditAddHintMut.current = null; penEditAddHint.value = null; return }
    }
    if (!altHeld) {
      const near = findNearestPointOnPenPath(stroke.penAnchors, stroke.penClosed === true, ptu[0], ptu[1], r.width * viewMut.scale, r.height * viewMut.scale)
      if (near && near.dist <= 6) {
        const hint = { x: near.x, y: near.y, segmentIndex: near.segmentIndex, t: near.t }
        penEditAddHintMut.current = hint; penEditAddHint.value = hint; return
      }
    }
    penEditAddHintMut.current = null; penEditAddHint.value = null; return
  }
  if (tool.value === 'pen') {
    const cur = draftMut.current
    const pt = toNorm(clientX, clientY)
    if (!pt) { penRemoveHintIndex.value = null; penCloseHover.value = false; return }
    if (cur?.kind === 'pen-bezier' && altHeld) {
      const hit = hitTestPenBezier(cur, pt[0], pt[1])
      if (hit?.type === 'anchor') { penRemoveHintIndex.value = hit.anchorIndex; penCloseHover.value = false; canvas.style.cursor = 'default'; return }
      penRemoveHintIndex.value = null; penCloseHover.value = false; canvas.style.cursor = 'crosshair'; return
    }
    if (cur?.kind === 'pen-bezier' && !altHeld && cur.anchors.length >= 2) {
      const hit = hitTestPenBezier(cur, pt[0], pt[1])
      const ch = hit?.type === 'anchor' && hit.anchorIndex === 0
      penCloseHover.value = ch; penRemoveHintIndex.value = null; return
    }
    penRemoveHintIndex.value = null; penCloseHover.value = false
  }
}

// ─── Tool setter ──────────────────────────────────────────────────────────────
function setTool(t: DrawTool) {
  tool.value = t
  releasePointerIfCaptured(canvasRef.value, moveDrag.current?.pointerId ?? -1)
  moveDrag.current = null
  if (t !== 'pen' && draftMut.current?.kind === 'pen-bezier') { draftMut.current = null; draft.value = null }
  penRemoveHintIndex.value = null; penCloseHover.value = false
  const c = canvasRef.value
  if (c) { if (t === 'pen') c.style.cursor = 'crosshair'; else if (t === 'move') c.style.cursor = 'default'; else c.style.cursor = 'crosshair' }
}

// ─── Tool events ──────────────────────────────────────────────────────────────
function onStrokeColorInput(e: Event) {
  const hex = (e.target as HTMLInputElement).value; strokeColor.value = hex
  if (docSelection.value.length > 0) {
    let next = props.document
    for (const sel of docSelection.value) next = updateVectorStrokeInDoc(next, sel.layerId, sel.strokeId, { stroke: hex })
    commitDoc(next)
  }
}

function onStrokeWidthInput(e: Event) {
  const px = parseInt((e.target as HTMLInputElement).value, 10); strokeWidthPx.value = px
  if (docSelection.value.length > 0) {
    const canvas = canvasRef.value; const r = canvas?.getBoundingClientRect(); const m = Math.max(1, Math.min(r?.width ?? 1, r?.height ?? 1))
    let next = props.document
    for (const sel of docSelection.value) next = updateVectorStrokeInDoc(next, sel.layerId, sel.strokeId, { strokeWidthN: px / m })
    commitDoc(next)
  }
}

function onFillColorInput(e: Event) {
  const hex = (e.target as HTMLInputElement).value; fillColor.value = hex
  if (docSelection.value.length > 0) {
    let next = props.document
    for (const sel of docSelection.value) next = updateVectorStrokeInDoc(next, sel.layerId, sel.strokeId, { fill: hex && hex !== 'transparent' ? hex : '' })
    commitDoc(next)
  }
}

// ─── Pointer event handlers ────────────────────────────────────────────────────
function onPointerDown(e: PointerEvent) {
  const canvas = canvasRef.value; const r = canvas?.getBoundingClientRect()

  if (e.button === 1 || (e.button === 0 && spaceDown.current)) {
    panDrag.current = { startX: e.clientX, startY: e.clientY, startTx: viewMut.tx, startTy: viewMut.ty, pointerId: e.pointerId }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    if (canvas) canvas.style.cursor = 'grabbing'; e.preventDefault(); return
  }

  if (e.button !== 0) return

  const toolVal = tool.value
  if (toolVal === 'move' && penEditSelectionMut.current) {
    const pt = toNormUnclamped(e.clientX, e.clientY)
    if (pt && r) {
      const layer = documentMut.current.layers.find((l) => l.id === penEditSelectionMut.current!.layerId)
      const stroke = layer?.strokes.find((s) => s.id === penEditSelectionMut.current!.strokeId)
      if (stroke?.kind === 'pen' && stroke.penAnchors) {
        const hitR = 8 / (viewMut.scale * Math.min(r.width, r.height)); const hitR2 = hitR * hitR
        for (let i = stroke.penAnchors.length - 1; i >= 0; i--) {
          const a = stroke.penAnchors[i]!
          if (a.outX != null && a.outY != null) { const dx = pt[0] - a.outX; const dy = pt[1] - a.outY; if (dx * dx + dy * dy <= hitR2) { penEditDrag.current = { type: 'handle-out', anchorIndex: i, pointerId: e.pointerId, last: pt }; ;(e.target as HTMLElement).setPointerCapture(e.pointerId); return } }
          if (a.inX != null && a.inY != null) { const dx = pt[0] - a.inX; const dy = pt[1] - a.inY; if (dx * dx + dy * dy <= hitR2) { penEditDrag.current = { type: 'handle-in', anchorIndex: i, pointerId: e.pointerId, last: pt }; ;(e.target as HTMLElement).setPointerCapture(e.pointerId); return } }
        }
        for (let i = stroke.penAnchors.length - 1; i >= 0; i--) {
          const a = stroke.penAnchors[i]!; const dx = pt[0] - a.x; const dy = pt[1] - a.y
          if (dx * dx + dy * dy <= hitR2) {
            if (pointerAltKey(e)) {
              const nextAnchors = stroke.penAnchors.slice(0, i).concat(stroke.penAnchors.slice(i + 1))
              if (nextAnchors.length === 0) { const removed = removeStrokesFromDoc(documentMut.current, [penEditSelectionMut.current!]); commitDoc(removed); penEditSelection.value = null; penEditSelectionMut.current = null; docSelection.value = [] }
              else commitDoc(updateStrokeInDocFull(documentMut.current, penEditSelectionMut.current!.layerId, penEditSelectionMut.current!.strokeId, { penAnchors: nextAnchors }))
              return
            }
            penEditDrag.current = { type: 'anchor', anchorIndex: i, pointerId: e.pointerId, last: pt }
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId); return
          }
        }
        if (!pointerAltKey(e) && stroke.penAnchors.length >= 2) {
          const near = findNearestPointOnPenPath(stroke.penAnchors, stroke.penClosed === true, pt[0], pt[1], r.width * viewMut.scale, r.height * viewMut.scale)
          if (near && near.dist <= 6) {
            const nextAnchors = splitPenBezierSegment(stroke.penAnchors, near.segmentIndex, near.t, stroke.penClosed === true)
            if (nextAnchors) {
              commitDoc(updateStrokeInDocFull(documentMut.current, penEditSelectionMut.current!.layerId, penEditSelectionMut.current!.strokeId, { penAnchors: nextAnchors }))
              penEditDrag.current = { type: 'anchor', anchorIndex: near.segmentIndex + 1, pointerId: e.pointerId, last: [near.x, near.y] }
              ;(e.target as HTMLElement).setPointerCapture(e.pointerId); penEditAddHintMut.current = null; penEditAddHint.value = null; return
            }
          }
        }
      }
    }
    penEditSelection.value = null; penEditSelectionMut.current = null
  }

  if (toolVal === 'move' && docSelection.value.length > 0 && r) {
    const selBounds = normBoundsForSelections(documentMut.current, docSelection.value)
    if (selBounds) {
      const pt = toNormUnclamped(e.clientX, e.clientY)
      if (pt) {
        const hitPxR = 10
        for (const id of RESIZE_HANDLE_IDS) {
          const [hx, hy] = handlePositionInBounds(id, selBounds)
          if (Math.hypot((pt[0] - hx) * r.width * viewMut.scale, (pt[1] - hy) * r.height * viewMut.scale) <= hitPxR) {
            resizeDrag.current = { handle: id, snapshotDoc: documentMut.current, snapshotSelections: docSelection.value, bounds: selBounds, anchor: anchorForHandle(id, selBounds), startPt: pt, pointerId: e.pointerId }
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            if (canvas) canvas.style.cursor = RESIZE_HANDLE_CURSORS[id]; return
          }
        }
      }
    }
  }

  const p = toNorm(e.clientX, e.clientY); if (!p) return

  if (toolVal === 'move') {
    const hit = findTopStrokeAt(props.document, p[0], p[1])
    if (!hit) {
      const mq = e.shiftKey
        ? { start: p, current: p, baseSelection: docSelection.value, additive: true, pointerId: e.pointerId }
        : { start: p, current: p, baseSelection: [] as DocStrokeSelection[], additive: false, pointerId: e.pointerId }
      if (!e.shiftKey) docSelection.value = []
      marqueeDrag.current = mq
      marqueeRect.value = { minX: p[0], minY: p[1], maxX: p[0], maxY: p[1] }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId); return
    }
    const hitSel: DocStrokeSelection = { layerId: hit.layerId, strokeId: hit.stroke.id }
    const alreadySelected = docSelection.value.some((s) => s.layerId === hitSel.layerId && s.strokeId === hitSel.strokeId)
    let nextSelection: DocStrokeSelection[]
    if (e.shiftKey) nextSelection = alreadySelected ? docSelection.value.filter((s) => !(s.layerId === hitSel.layerId && s.strokeId === hitSel.strokeId)) : [...docSelection.value, hitSel]
    else nextSelection = alreadySelected ? docSelection.value : [hitSel]
    if (pointerAltKey(e) && nextSelection.length > 0) {
      const dup = duplicateSelectionsInPlace(documentMut.current, nextSelection)
      if (dup) { commitLive(dup.doc); nextSelection = dup.newSelections }
    }
    docSelection.value = nextSelection
    const clickedStaysSelected = nextSelection.some((s) => s.layerId === hitSel.layerId && s.strokeId === hitSel.strokeId)
    if (clickedStaysSelected && nextSelection.length > 0) {
      moveDrag.current = { selections: nextSelection, last: p, pointerId: e.pointerId }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      if (canvas) canvas.style.cursor = 'grabbing'
    }
    return
  }

  const active = getActiveLayer(props.document); if (!active || !active.visible) return

  if (toolVal === 'pen') {
    const cur = draftMut.current
    if (cur?.kind === 'pen-bezier') {
      const hit = hitTestPenBezier(cur, p[0], p[1])
      if (hit?.type === 'handle') {
        const next: PenBezierDraftState = { ...cur, selectedAnchor: hit.anchorIndex, drag: { type: 'handle', anchorIndex: hit.anchorIndex, which: hit.which } }
        draftMut.current = next; draft.value = next; ;(e.target as HTMLElement).setPointerCapture(e.pointerId); return
      }
      if (hit?.type === 'anchor') {
        if (pointerAltKey(e)) {
          const nextAnchors = removePenAnchorAt(cur.anchors, hit.anchorIndex)
          if (nextAnchors.length === 0) { draftMut.current = null; draft.value = null }
          else { const next: PenBezierDraftState = { ...cur, anchors: nextAnchors, selectedAnchor: null, drag: null }; draftMut.current = next; draft.value = next }
          penRemoveHintIndex.value = null; penCloseHover.value = false; return
        }
        if (hit.anchorIndex === 0 && cur.anchors.length >= 2) { commitPenBezierDraft(true); return }
        const next: PenBezierDraftState = { ...cur, selectedAnchor: hit.anchorIndex, drag: null }; draftMut.current = next; draft.value = next; return
      }
    }
    const prevAnchors = draftMut.current?.kind === 'pen-bezier' ? draftMut.current.anchors.map((a) => ({ ...a })) : []
    const anchors: VectorPenAnchor[] = [...prevAnchors, { x: p[0], y: p[1] }]
    const next: PenBezierDraftState = { kind: 'pen-bezier', anchors, selectedAnchor: null, drag: { type: 'place', anchorIndex: anchors.length - 1, startX: p[0], startY: p[1] } }
    draftMut.current = next; draft.value = next; ;(e.target as HTMLElement).setPointerCapture(e.pointerId); return
  }

  if (toolVal === 'pencil') {
    const next: PolylineDraftState = { kind: 'polyline', tool: 'pencil', points: [p] }
    draftMut.current = next; draft.value = next; ;(e.target as HTMLElement).setPointerCapture(e.pointerId); return
  }

  if (toolVal === 'rect' || toolVal === 'ellipse') {
    const next: ShapeDraft = { kind: 'shape', tool: toolVal, a: p }
    draftMut.current = next; draft.value = next; ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
}

function onPointerMove(e: PointerEvent) {
  const canvas = canvasRef.value
  lastCanvasPointerClient.current = { x: e.clientX, y: e.clientY }
  altKeyHeld.current = pointerAltKey(e)

  if (panDrag.current) {
    const pan = panDrag.current; viewTx.value = pan.startTx + (e.clientX - pan.startX); viewTy.value = pan.startTy + (e.clientY - pan.startY); return
  }

  if (resizeDrag.current) {
    const rd = resizeDrag.current; const cur = toNormUnclamped(e.clientX, e.clientY); if (!cur) return
    const handle = rd.handle
    const affectsX = ['nw', 'ne', 'se', 'sw', 'e', 'w'].includes(handle)
    const affectsY = ['nw', 'ne', 'se', 'sw', 'n', 's'].includes(handle)
    const origHx = handlePositionInBounds(handle, rd.bounds)
    let originX: number; let originY: number; let sx = 1; let sy = 1
    if (pointerAltKey(e)) { originX = (rd.bounds.minX + rd.bounds.maxX) / 2; originY = (rd.bounds.minY + rd.bounds.maxY) / 2 }
    else { originX = rd.anchor[0]; originY = rd.anchor[1] }
    if (affectsX) { const origDx = origHx[0] - originX; const curDx = cur[0] - originX; if (Math.abs(origDx) > 1e-9) sx = curDx / origDx }
    if (affectsY) { const origDy = origHx[1] - originY; const curDy = cur[1] - originY; if (Math.abs(origDy) > 1e-9) sy = curDy / origDy }
    if (e.shiftKey) {
      if (affectsX && affectsY) { const m = Math.max(Math.abs(sx), Math.abs(sy)); sx = (sx < 0 ? -1 : 1) * m; sy = (sy < 0 ? -1 : 1) * m }
      else if (affectsX) { sy = Math.abs(sx) * (sy < 0 ? -1 : 1) }
      else if (affectsY) { sx = Math.abs(sy) * (sx < 0 ? -1 : 1) }
    }
    if (affectsX && !affectsY) sy = 1; if (affectsY && !affectsX) sx = 1
    commitLive(applyScaleStrokesInDoc(rd.snapshotDoc, rd.snapshotSelections, originX, originY, sx, sy)); return
  }

  if (penEditDrag.current) {
    const ped = penEditDrag.current; const pt2 = toNormUnclamped(e.clientX, e.clientY)
    if (!pt2 || !penEditSelectionMut.current) return
    const layer = documentMut.current.layers.find((l) => l.id === penEditSelectionMut.current!.layerId)
    const stroke = layer?.strokes.find((s) => s.id === penEditSelectionMut.current!.strokeId)
    if (!stroke?.penAnchors) return
    const anchors = stroke.penAnchors.map((a) => ({ ...a })); const a = anchors[ped.anchorIndex]; if (!a) return
    if (ped.type === 'anchor') { const ddx = pt2[0] - ped.last[0]; const ddy = pt2[1] - ped.last[1]; a.x += ddx; a.y += ddy; if (a.inX != null) a.inX += ddx; if (a.inY != null) a.inY += ddy; if (a.outX != null) a.outX += ddx; if (a.outY != null) a.outY += ddy }
    else if (ped.type === 'handle-in') { a.inX = pt2[0]; a.inY = pt2[1] }
    else { a.outX = pt2[0]; a.outY = pt2[1] }
    ped.last = pt2; commitLive(updateStrokeInDocFull(documentMut.current, penEditSelectionMut.current!.layerId, penEditSelectionMut.current!.strokeId, { penAnchors: anchors })); return
  }

  const pt = toNorm(e.clientX, e.clientY)

  if (tool.value === 'move' && moveDrag.current && pt) {
    const m = moveDrag.current; const ddx = pt[0] - m.last[0]; const ddy = pt[1] - m.last[1]; m.last = pt
    commitLive(applyTranslateStrokesInDoc(documentMut.current, m.selections, ddx, ddy)); return
  }

  if (tool.value === 'move' && marqueeDrag.current && pt) {
    const mq = marqueeDrag.current; mq.current = pt
    const minX = Math.min(mq.start[0], pt[0]); const minY = Math.min(mq.start[1], pt[1])
    const maxX = Math.max(mq.start[0], pt[0]); const maxY = Math.max(mq.start[1], pt[1])
    marqueeRect.value = { minX, minY, maxX, maxY }
    const hits = findStrokesIntersectingRect(documentMut.current, { minX, minY, maxX, maxY })
    if (mq.additive) {
      const seen = new Set<string>(); const merged: DocStrokeSelection[] = []
      for (const s of [...mq.baseSelection, ...hits]) { const key = `${s.layerId}:${s.strokeId}`; if (seen.has(key)) continue; seen.add(key); merged.push(s) }
      docSelection.value = merged
    } else { docSelection.value = hits }
    return
  }

  if ((tool.value === 'pen' || (tool.value === 'move' && penEditSelectionMut.current)) && canvas) {
    updatePenHoverCursor(e.clientX, e.clientY, pointerAltKey(e))
  } else if (tool.value !== 'pen') { penRemoveHintIndex.value = null; penCloseHover.value = false }

  const d = draftMut.current; if (!d || !pt) return

  if (d.kind === 'pen-bezier' && d.drag) {
    if (d.drag.type === 'place') {
      const nextAnchors = d.anchors.map((a) => ({ ...a })); applySmoothPlacementHandles(nextAnchors, d.drag.anchorIndex, pt[0], pt[1])
      const nd: PenBezierDraftState = { ...d, anchors: nextAnchors }; draftMut.current = nd; draft.value = nd; return
    }
    if (d.drag.type === 'handle') {
      const nextAnchors = d.anchors.map((a) => ({ ...a })); const anc = nextAnchors[d.drag.anchorIndex]!
      if (d.drag.which === 'in') { anc.inX = pt[0]; anc.inY = pt[1]; anc.outX = 2 * anc.x - pt[0]; anc.outY = 2 * anc.y - pt[1] }
      else { anc.outX = pt[0]; anc.outY = pt[1]; anc.inX = 2 * anc.x - pt[0]; anc.inY = 2 * anc.y - pt[1] }
      const nd: PenBezierDraftState = { ...d, anchors: nextAnchors }; draftMut.current = nd; draft.value = nd; return
    }
  }

  if (d.kind === 'pen-bezier') return

  if (d.kind === 'polyline') {
    const next = appendPoint(d.points, pt); const nd: PolylineDraftState = { ...d, points: next }; draftMut.current = nd; draft.value = nd; return
  }

  if (d.kind !== 'shape') return
  const sh = d; let b = pt
  if (e.shiftKey) {
    const rect = canvas?.getBoundingClientRect(); const rw = rect ? Math.max(1, rect.width) : 1; const rh = rect ? Math.max(1, rect.height) : 1
    b = constrainShapeEnd(sh.a, pt, rw, rh)
  }
  const nd: ShapeDraft = { kind: 'shape', tool: sh.tool, a: sh.a, b }; draftMut.current = nd; draft.value = nd
}

function onPointerUp(e: PointerEvent) {
  const el = e.target as HTMLElement
  const releaseCapture = () => { try { if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId) } catch { /* ignore */ } }

  if (panDrag.current) {
    panDrag.current = null; releaseCapture()
    const c = canvasRef.value; if (c) c.style.cursor = spaceDown.current ? 'grab' : 'default'; return
  }

  if (resizeDrag.current) {
    resizeDrag.current = null; releaseCapture(); commitDoc(documentMut.current)
    const c = canvasRef.value; if (c) c.style.cursor = tool.value === 'move' ? 'default' : 'default'; return
  }

  if (penEditDrag.current) { penEditDrag.current = null; releaseCapture(); commitDoc(documentMut.current); return }

  if (tool.value === 'move' && moveDrag.current) {
    moveDrag.current = null; releaseCapture(); commitDoc(documentMut.current)
    const c = canvasRef.value; if (c) c.style.cursor = 'default'; return
  }

  if (tool.value === 'move' && marqueeDrag.current) {
    marqueeDrag.current = null; marqueeRect.value = null; releaseCapture()
    const c = canvasRef.value; if (c) c.style.cursor = 'default'; return
  }

  const d = draftMut.current; if (!d) return

  if (d.kind === 'pen-bezier') {
    try { if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    const pt = toNorm(e.clientX, e.clientY)
    if (d.drag?.type === 'place' && pt) {
      const moved = Math.hypot(pt[0] - d.drag.startX, pt[1] - d.drag.startY)
      const nextAnchors = d.anchors.map((a) => ({ ...a })); const i = d.drag.anchorIndex
      if (moved < PEN_CORNER_DRAG && i >= 0) {
        const B = nextAnchors[i]!; delete B.inX; delete B.inY; delete B.outX; delete B.outY
        if (i > 0) { const A = nextAnchors[i - 1]!; delete A.outX; delete A.outY }
      }
      const nd: PenBezierDraftState = { ...d, anchors: nextAnchors, drag: null }; draftMut.current = nd; draft.value = nd; return
    }
    if (d.drag?.type === 'handle') { const nd: PenBezierDraftState = { ...d, drag: null }; draftMut.current = nd; draft.value = nd; return }
    return
  }

  ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  draftMut.current = null; draft.value = null

  const swN = strokeWidthNFromCanvas(); const fill = getShapeFill()

  if (d.kind === 'polyline') {
    if (d.points.length < 2) return
    commitStrokeToActiveLayer({ id: crypto.randomUUID(), kind: 'pen', points: d.points, stroke: strokeColor.value, strokeWidthN: swN, fill: '' }); return
  }

  const sh = d; const canvas = canvasRef.value; const rect = canvas?.getBoundingClientRect()
  const w = rect ? Math.max(1, rect.width) : 1; const h = rect ? Math.max(1, rect.height) : 1
  const vs = Math.max(0.0001, viewMut.scale)
  const b0 = sh.b ?? sh.a; const dxPx = (b0[0] - sh.a[0]) * w * vs; const dyPx = (b0[1] - sh.a[1]) * h * vs
  const MIN_DRAG_PX = 3; const DEFAULT_SIZE_PX = 100
  let a = sh.a; let b = b0
  if (Math.abs(dxPx) < MIN_DRAG_PX && Math.abs(dyPx) < MIN_DRAG_PX) {
    const halfW = DEFAULT_SIZE_PX / 2 / (w * vs); const halfH = DEFAULT_SIZE_PX / 2 / (h * vs)
    a = [sh.a[0] - halfW, sh.a[1] - halfH]; b = [sh.a[0] + halfW, sh.a[1] + halfH]
  }
  commitStrokeToActiveLayer({ id: crypto.randomUUID(), kind: sh.tool as VectorStrokeKind, points: [a, b], stroke: '', strokeWidthN: 0, fill })
}

function onDblClick(e: MouseEvent) {
  if (tool.value !== 'move') return
  const p = toNorm(e.clientX, e.clientY); if (!p) return
  const hit = findTopStrokeAt(props.document, p[0], p[1])
  if (hit && hit.stroke.kind === 'pen' && hit.stroke.penAnchors && hit.stroke.penAnchors.length > 0) {
    const sel = { layerId: hit.layerId, strokeId: hit.stroke.id }
    penEditSelection.value = sel; penEditSelectionMut.current = sel
    docSelection.value = [sel]
  }
}

function onPointerLeave() {
  penRemoveHintIndex.value = null; penCloseHover.value = false
  const c = canvasRef.value; if (c) c.style.cursor = tool.value === 'move' ? 'default' : 'crosshair'
}

// ─── Layer management ─────────────────────────────────────────────────────────
function clearActiveLayer() {
  const active = getActiveLayer(props.document); if (!active) return
  docSelection.value = docSelection.value.filter((s) => s.layerId !== active.id)
  commitDoc({ ...props.document, layers: props.document.layers.map((L) => L.id !== active.id ? L : { ...L, strokes: [] }) })
}

function clearAll() { docSelection.value = []; commitDoc(emptyVectorBoardDocument()) }

function addLayer() {
  const n = props.document.layers.length + 1; const L = createVectorBoardLayer(`Layer ${n}`)
  commitDoc({ ...props.document, layers: [...props.document.layers, L], activeLayerId: L.id })
}

function deleteLayer(id: string) {
  if (props.document.layers.length <= 1) return
  const next = props.document.layers.filter((l) => l.id !== id)
  let activeLayerId = props.document.activeLayerId
  if (activeLayerId === id) activeLayerId = next[0]!.id
  commitDoc({ ...props.document, layers: next, activeLayerId })
}

function moveLayer(id: string, dir: -1 | 1) {
  const i = props.document.layers.findIndex((l) => l.id === id); if (i < 0) return
  const j = i + dir; if (j < 0 || j >= props.document.layers.length) return
  const copy = [...props.document.layers]; const t = copy[i]!; copy[i] = copy[j]!; copy[j] = t
  commitDoc({ ...props.document, layers: copy })
}

function setLayerVisible(id: string, visible: boolean) {
  commitDoc({ ...props.document, layers: props.document.layers.map((L) => L.id !== id ? L : { ...L, visible }) })
}

// ─── Save actions ─────────────────────────────────────────────────────────────
function onSaveClick() { saveSplitOpen.value = false; props.onSave() }
function onSaveAndPlaceClick() { if (!canPlace.value) return; saveSplitOpen.value = false; props.onSaveAndPlace() }

// ─── Keep mutable refs in sync with reactive state ────────────────────────────
watch(viewScale, (v) => { viewMut.scale = v })
watch(viewTx, (v) => { viewMut.tx = v })
watch(viewTy, (v) => { viewMut.ty = v })
watch(penEditSelection, (v) => { penEditSelectionMut.current = v })
watch(penEditAddHint, (v) => { penEditAddHintMut.current = v })
watch(() => props.document, (v) => { documentMut.current = v })

// ─── Canvas rendering loop ────────────────────────────────────────────────────
watch(
  [() => props.document, strokeColor, strokeWidthPx, fillColor, penRemoveHintIndex, penCloseHover, docSelection, marqueeRect, viewScale, viewTx, viewTy, penEditSelection, penEditAddHint],
  () => { if (props.open) paintFrame() },
  { deep: true },
)

watch(draft, () => { draftMut.current = draft.value; if (props.open) paintFrame() })

let ro: ResizeObserver | null = null

watch(() => props.open, (open) => {
  if (!open) {
    releasePointerIfCaptured(canvasRef.value, moveDrag.current?.pointerId ?? -1)
    releasePointerIfCaptured(canvasRef.value, marqueeDrag.current?.pointerId ?? -1)
    releasePointerIfCaptured(canvasRef.value, resizeDrag.current?.pointerId ?? -1)
    releasePointerIfCaptured(canvasRef.value, penEditDrag.current?.pointerId ?? -1)
    releasePointerIfCaptured(canvasRef.value, panDrag.current?.pointerId ?? -1)
    docSelection.value = []; marqueeRect.value = null; penEditSelection.value = null; penEditSelectionMut.current = null
    moveDrag.current = null; marqueeDrag.current = null; resizeDrag.current = null; penEditDrag.current = null; panDrag.current = null
    spaceDown.current = false; ro?.disconnect(); ro = null
    return
  }
  // Reset view on open
  history.stack = [props.document]; history.index = 0
  viewScale.value = 1; viewTx.value = 0; viewTy.value = 0
  nextTick(() => {
    paintFrame()
    if (wrapRef.value && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => paintFrame()); ro.observe(wrapRef.value)
    }
  })
}, { immediate: false })

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  if (!props.open) return

  if (e.key === 'Escape' && e.target === document.body) {
    if (penEditSelectionMut.current) { e.preventDefault(); penEditSelection.value = null; penEditSelectionMut.current = null; return }
    emit('close'); return
  }

  if (e.key === 'Enter' && tool.value === 'pen') {
    const cur = draftMut.current
    if (cur?.kind === 'pen-bezier' && cur.anchors.length >= 2) { e.preventDefault(); commitPenBezierDraft(); return }
  }

  if (e.key === ' ' || e.code === 'Space') {
    if (!spaceDown.current) { spaceDown.current = true; const c = canvasRef.value; if (c && !panDrag.current) c.style.cursor = 'grab' }
    if (!draftMut.current) e.preventDefault(); return
  }

  const t = e.target as HTMLElement
  if (t.closest('input, textarea, [contenteditable="true"]')) return

  if (draftMut.current) return

  if (e.metaKey || e.ctrlKey) {
    if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); e.stopPropagation(); if (e.shiftKey) redoVector(); else undoVector(); return }
    if ((e.key === '=' || e.key === '+') && !e.shiftKey) { e.preventDefault(); zoomAtCenter(1.2); return }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomAtCenter(1 / 1.2); return }
    if (e.key === '0') { e.preventDefault(); resetView(); return }
    if (e.key === '1') { e.preventDefault(); fitView(); return }
    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault()
      const all: DocStrokeSelection[] = []
      for (const L of documentMut.current.layers) for (const s of L.strokes) all.push({ layerId: L.id, strokeId: s.id })
      docSelection.value = all; return
    }
    if (e.key === 'd' || e.key === 'D') {
      if (docSelection.value.length === 0) return; e.preventDefault()
      const dup = duplicateSelectionsInPlace(documentMut.current, docSelection.value)
      if (dup) { commitDoc(dup.doc); docSelection.value = dup.newSelections }; return
    }
    if (e.key === ']') { if (docSelection.value.length === 0) return; e.preventDefault(); e.stopPropagation(); commitDoc(applyZOrderInDoc(documentMut.current, docSelection.value, e.shiftKey ? 'front' : 'forward')); return }
    if (e.key === '[') { if (docSelection.value.length === 0) return; e.preventDefault(); e.stopPropagation(); commitDoc(applyZOrderInDoc(documentMut.current, docSelection.value, e.shiftKey ? 'back' : 'backward')); return }
    if (e.key === 'c' || e.key === 'C') {
      if (docSelection.value.length === 0) return; const strokes = getStrokesForSelections(documentMut.current, docSelection.value); if (!strokes.length) return
      e.preventDefault(); e.stopPropagation()
      void navigator.clipboard.writeText(JSON.stringify({ avnacVectorStrokeClip: true, v: 1, strokes })).catch(() => {}); return
    }
    if (e.key === 'v' || e.key === 'V') {
      e.preventDefault(); e.stopPropagation()
      void (async () => {
        let text: string; try { text = await navigator.clipboard.readText() } catch { return }
        const strokes = parseVectorStrokeClipboardText(text); if (!strokes) return
        const appended = appendClonedStrokesToActiveLayer(documentMut.current, strokes, VECTOR_CLIPBOARD_PASTE_OFFSET_N, VECTOR_CLIPBOARD_PASTE_OFFSET_N)
        if (!appended) return; commitDoc(appended.doc)
        const layer = getActiveLayer(appended.doc); if (layer) docSelection.value = appended.newStrokeIds.map((strokeId) => ({ layerId: layer.id, strokeId }))
      })(); return
    }
  }

  if (e.key === 'Backspace' || e.key === 'Delete') {
    if (docSelection.value.length === 0) return; e.preventDefault(); e.stopPropagation()
    commitDoc(removeStrokesFromDoc(documentMut.current, docSelection.value)); docSelection.value = []; penEditSelection.value = null; penEditSelectionMut.current = null; return
  }

  if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key.length === 1) {
    const k = e.key.toLowerCase(); let nextTool: DrawTool | null = null
    if (k === 'v' && !e.shiftKey) nextTool = 'move'
    else if (k === 'p' && e.shiftKey) nextTool = 'pencil'
    else if (k === 'p' && !e.shiftKey) nextTool = 'pen'
    else if (k === 'r' && !e.shiftKey) nextTool = 'rect'
    else if (k === 'o' && !e.shiftKey) nextTool = 'ellipse'
    if (nextTool) { e.preventDefault(); e.stopPropagation(); setTool(nextTool); return }
  }

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && docSelection.value.length > 0 && !e.metaKey && !e.ctrlKey) {
    e.preventDefault(); e.stopPropagation()
    const canvas = canvasRef.value; const r = canvas?.getBoundingClientRect()
    const rw = r ? Math.max(1, r.width) : 1; const rh = r ? Math.max(1, r.height) : 1
    const step = e.shiftKey ? 10 : 1; let dxp = 0; let dyp = 0
    if (e.key === 'ArrowLeft') dxp = -step; if (e.key === 'ArrowRight') dxp = step
    if (e.key === 'ArrowUp') dyp = -step; if (e.key === 'ArrowDown') dyp = step
    commitDoc(applyTranslateStrokesInDoc(documentMut.current, docSelection.value, dxp / rw, dyp / rh))
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === ' ' || e.code === 'Space') {
    spaceDown.current = false; const c = canvasRef.value
    if (c && !panDrag.current) c.style.cursor = tool.value === 'move' ? 'default' : 'crosshair'
  }
}

function onAltKey(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key !== 'Alt' && e.code !== 'AltLeft' && e.code !== 'AltRight') return
  const last = lastCanvasPointerClient.current; if (!last) return
  altKeyHeld.current = e.type === 'keydown'; updatePenHoverCursor(last.x, last.y, altKeyHeld.current)
}

function onWindowBlur() {
  altKeyHeld.current = false; const last = lastCanvasPointerClient.current
  if (last) updatePenHoverCursor(last.x, last.y, false)
}

// Save-split click outside
function onSaveSplitOutsideClick(e: MouseEvent) {
  if (saveSplitRef.value?.contains(e.target as Node)) return; saveSplitOpen.value = false
}

// Wheel zoom/pan
function onWheel(e: WheelEvent) {
  if (!props.open) return
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault(); const canvas = canvasRef.value; if (!canvas) return
    const r = canvas.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.01)); return
  }
  e.preventDefault(); viewTx.value -= e.deltaX; viewTy.value -= e.deltaY
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('keyup', onKeyUp, true)
  window.addEventListener('keydown', onAltKey, true)
  window.addEventListener('keyup', onAltKey, true)
  window.addEventListener('blur', onWindowBlur)
  window.document.addEventListener('mousedown', onSaveSplitOutsideClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown, true)
  window.removeEventListener('keyup', onKeyUp, true)
  window.removeEventListener('keydown', onAltKey, true)
  window.removeEventListener('keyup', onAltKey, true)
  window.removeEventListener('blur', onWindowBlur)
  window.document.removeEventListener('mousedown', onSaveSplitOutsideClick)
  ro?.disconnect()
})

// Wire canvas wheel event (passive: false required for preventDefault)
watch(() => [props.open, canvasRef.value], ([open, canvas]) => {
  if (!canvas) return
  if (open) (canvas as HTMLCanvasElement).addEventListener('wheel', onWheel, { passive: false })
  else (canvas as HTMLCanvasElement).removeEventListener('wheel', onWheel)
}, { immediate: false })

// Sync selection stroke → toolbar colors
watch([() => props.open, primarySelection], ([open, ps]) => {
  if (!open || !ps) return
  const layer = documentMut.current.layers.find((l) => l.id === ps.layerId)
  const s = layer?.strokes.find((x) => x.id === ps.strokeId); if (!s) return
  const canvas = canvasRef.value; const r = canvas?.getBoundingClientRect(); const m = Math.max(1, Math.min(r?.width ?? 1, r?.height ?? 1))
  if (s.stroke && s.stroke !== 'transparent') strokeColor.value = s.stroke
  if (s.fill && s.fill !== 'transparent') fillColor.value = s.fill
  strokeWidthPx.value = Math.min(16, Math.max(0, Math.round(s.strokeWidthN * m)))
})
</script>

<style scoped>
.vb-icon-btn {
  display: flex; align-items: center; justify-content: center;
  min-width: 32px; height: 32px; border-radius: 8px; border: none; background: transparent;
  cursor: pointer; color: var(--fg-subtle, #737373); padding: 0 4px;
}
.vb-icon-btn:hover { background: rgba(0,0,0,0.06); color: var(--fg-default, #262626) }
.vb-icon-btn.active { background: rgba(0,0,0,0.08); color: var(--fg-default, #262626) }
.vb-icon-btn.wide { min-width: auto }
.vb-toolbar-shell {
  display: flex; align-items: center; background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0); border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
</style>
