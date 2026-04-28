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
    </template>

    <!-- Image corner radius -->
    <template v-if="canvasStore.imageCornerToolbar">
      <div class="avnac-divider" />
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

const showPaint = computed(() => !canvasStore.textToolbarValues && !canvasStore.shapeToolbarModel)

const emit = defineEmits<{
  paintChange: [v: BgValue]
  textFormatChange: [partial: Partial<TextFormatToolbarValues>]
  shapePaintChange: [v: BgValue]
  cornerRadiusChange: [v: number]
  imageCornerRadiusChange: [v: number]
  strokeWidthChange: [v: number]
  strokePaintChange: [v: BgValue]
  blurChange: [v: number]
  opacityChange: [v: number]
  shadowChange: [v: FabricShadowUi]
  shadowToggle: []
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
</style>
