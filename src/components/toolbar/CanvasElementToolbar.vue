<template>
  <FloatingToolbarShell aria-label="Element toolbar">
    <!-- Paint (fill) -->
    <PaintPopoverControl
      v-if="showPaint"
      :value="canvasStore.selectedPaint"
      compact
      title="Fill color"
      @change="emit('paintChange', $event)"
    />

    <!-- Text formatting -->
    <template v-if="canvasStore.textToolbarValues">
      <div class="avnac-divider" />
      <TextFormatToolbar
        :values="canvasStore.textToolbarValues"
        @change="emit('textFormatChange', $event)"
      />
    </template>

    <template v-else>
      <!-- Shape options -->
      <template v-if="canvasStore.shapeToolbarModel">
      <div class="avnac-divider" />
      <PaintPopoverControl
        :value="canvasStore.shapeToolbarModel.paint"
        compact
        title="Shape fill"
        @change="emit('shapePaintChange', $event)"
      />
      <CornerRadiusToolbarControl
        v-if="canvasStore.shapeToolbarModel.rectCornerRadiusMax !== undefined"
        :value="canvasStore.shapeToolbarModel.rectCornerRadius ?? 0"
        :max="canvasStore.shapeToolbarModel.rectCornerRadiusMax ?? 0"
        @change="emit('cornerRadiusChange', $event)"
      />
      <template v-if="lineToolbarMeta">
        <select
          class="avnac-small-select"
          title="Line path"
          :value="lineToolbarMeta.arrowPathType ?? 'straight'"
          @change="emit('linePathTypeChange', ($event.target as HTMLSelectElement).value as any)"
        >
          <option value="straight">Straight</option>
          <option value="curved">Curved</option>
        </select>
        <select
          class="avnac-small-select"
          title="Line ending"
          :value="lineHasArrowHead ? 'arrow' : 'none'"
          @change="emit('lineArrowHeadChange', ($event.target as HTMLSelectElement).value as any)"
        >
          <option value="none">No arrow</option>
          <option value="arrow">Arrow</option>
        </select>
        <select
          class="avnac-small-select"
          title="Line style"
          :value="lineToolbarMeta.arrowLineStyle ?? 'solid'"
          @change="emit('lineStyleChange', ($event.target as HTMLSelectElement).value as any)"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </template>
      </template>

      <!-- Image corner radius -->
      <template v-if="canvasStore.imageCornerToolbar">
      <div class="avnac-divider" />
      <button class="avnac-toolbar-btn" title="Crop image" @click="emit('cropImage')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M2 6h14a2 2 0 0 1 2 2v14"/>
        </svg>
      </button>
      <select
        class="avnac-mask-select"
        title="Image mask"
        @change="emit('imageMaskChange', ($event.target as HTMLSelectElement).value as any)"
      >
        <option value="">Mask</option>
        <option value="none">No mask</option>
        <option value="rounded">Rounded</option>
        <option value="circle">Circle</option>
        <option value="ellipse">Ellipse</option>
      </select>
      <CornerRadiusToolbarControl
        :value="canvasStore.imageCornerToolbar.radius"
        :max="canvasStore.imageCornerToolbar.max"
        @change="emit('imageCornerRadiusChange', $event)"
      />
      </template>

      <div class="avnac-divider" />

      <!-- Stroke -->
      <StrokeToolbarPopover
      :stroke-width-px="canvasStore.selectionOutlineStrokeWidth"
      :stroke-paint="canvasStore.selectionOutlineStrokePaint"
      @stroke-width-change="emit('strokeWidthChange', $event)"
      @stroke-paint-change="emit('strokePaintChange', $event)"
      />

      <!-- Blur -->
      <BlurToolbarControl
      :blur-pct="canvasStore.selectionBlurPct"
      @change="emit('blurChange', $event)"
      />

      <!-- Opacity -->
      <TransparencyToolbarPopover
      :opacity-pct="canvasStore.selectionOpacityPct"
      @change="emit('opacityChange', $event)"
      />

      <!-- Shadow -->
      <ShadowToolbarPopover
      :value="canvasStore.selectionShadowUi"
      :shadow-active="canvasStore.selectionShadowActive"
      @change="emit('shadowChange', $event)"
      />

      <div class="avnac-divider" />

      <!-- Shadow toggle -->
      <button
      class="avnac-toolbar-btn"
      :class="{ active: canvasStore.selectionShadowActive }"
      title="Toggle shadow"
      @click="emit('shadowToggle')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="13" height="13" rx="2"/>
        <rect x="8" y="8" width="13" height="13" rx="2" stroke-opacity="0.4"/>
      </svg>
      </button>

      <!-- Edit chart data (shown when chart group is selected) -->
      <template v-if="canvasStore.shapeToolbarModel?.meta?.kind === ('chart' as any)">
      <div class="avnac-divider" />
      <button class="avnac-toolbar-btn" title="Edit chart data" @click="emit('editChartData')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="8" height="6" rx="1"/><rect x="13" y="3" width="8" height="6" rx="1"/>
          <rect x="3" y="13" width="8" height="6" rx="1"/><rect x="13" y="13" width="8" height="6" rx="1"/>
        </svg>
        <span style="font-size:11px;margin-left:2px">Data</span>
      </button>
      </template>

      <!-- Convert smart object to ordinary shapes -->
      <template v-if="smartObjectSelected">
      <div class="avnac-divider" />
      <button class="avnac-toolbar-btn" title="Convert to shapes" @click="emit('convertSmartObject')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </button>
      </template>
    </template>

    <!-- Animate -->
    <button
      v-if="!canvasStore.textToolbarValues"
      class="avnac-toolbar-btn"
      title="Animations"
      @click="emit('openAnimationPanel')"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.2L12 14l-4.8 2.5.9-5.2L4.3 7.6l5.3-.8z"/>
      </svg>
    </button>

    <div class="avnac-divider" />

    <!-- Delete -->
    <button class="avnac-toolbar-btn danger" title="Delete" @click="emit('delete')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    </button>
  </FloatingToolbarShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '#/stores/canvas'
import type { TextFormatToolbarValues } from '#/stores/canvas'
import type { BgValue } from '#/lib/bg-value'
import type { FabricShadowUi } from '#/lib/avnac-fabric-shadow'
import FloatingToolbarShell from './FloatingToolbarShell.vue'
import TextFormatToolbar from './TextFormatToolbar.vue'
import StrokeToolbarPopover from './StrokeToolbarPopover.vue'
import ShadowToolbarPopover from './ShadowToolbarPopover.vue'
import BlurToolbarControl from './BlurToolbarControl.vue'
import TransparencyToolbarPopover from './TransparencyToolbarPopover.vue'
import CornerRadiusToolbarControl from './CornerRadiusToolbarControl.vue'
import PaintPopoverControl from '#/components/shared/PaintPopoverControl.vue'

const canvasStore = useCanvasStore()
const lineToolbarMeta = computed(() => {
  const meta = canvasStore.shapeToolbarModel?.meta
  if (!meta) return null
  return meta.kind === 'line' || meta.kind === 'arrow' ? meta : null
})
const lineHasArrowHead = computed(() => {
  const meta = lineToolbarMeta.value
  return !!meta && (meta.kind === 'arrow' || (meta.arrowHead ?? 0) > 0)
})

defineProps<{
  smartObjectSelected?: boolean
}>()

const showPaint = computed(() => !canvasStore.textToolbarValues && !canvasStore.shapeToolbarModel)

const emit = defineEmits<{
  paintChange: [v: BgValue]
  textFormatChange: [partial: Partial<TextFormatToolbarValues>]
  shapePaintChange: [v: BgValue]
  cornerRadiusChange: [v: number]
  imageCornerRadiusChange: [v: number]
  imageMaskChange: [v: 'none' | 'rect' | 'rounded' | 'circle' | 'ellipse']
  cropImage: []
  linePathTypeChange: [v: 'straight' | 'curved']
  lineArrowHeadChange: [v: 'none' | 'arrow']
  lineStyleChange: [v: 'solid' | 'dashed' | 'dotted']
  strokeWidthChange: [v: number]
  strokePaintChange: [v: BgValue]
  blurChange: [v: number]
  opacityChange: [v: number]
  shadowChange: [v: FabricShadowUi]
  shadowToggle: []
  openAnimationPanel: []
  editChartData: []
  convertSmartObject: []
  delete: []
}>()
</script>

<style scoped>
.avnac-divider {
  width: 1px;
  height: 20px;
  background: var(--border-default, #e0e0e0);
  margin: 0 2px;
  flex-shrink: 0;
}
.avnac-toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--fg-default, #262626);
}
.avnac-toolbar-btn:hover { background: var(--bg-subtle, #f0f0f0); }
.avnac-toolbar-btn.active { background: var(--bg-subtle, #f0f0f0); }
.avnac-toolbar-btn.danger:hover { background: #fee2e2; color: #dc2626; }
.avnac-mask-select,
.avnac-small-select {
  height: 28px;
  max-width: 78px;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 6px;
  background: var(--surface-raised, #fff);
  color: var(--fg-default, #262626);
  font-size: 11px;
  outline: none;
}
.avnac-small-select {
  max-width: 94px;
}
</style>
