<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
      @mousedown.self="emit('cancel')"
    >
      <div class="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-[var(--surface)] shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <h2 class="m-0 text-base font-semibold text-[var(--text)]">Crop image</h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-neutral-500 hover:bg-black/5 hover:text-neutral-800"
            aria-label="Close"
            @click="emit('cancel')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Image area -->
        <div class="min-h-0 flex-1 overflow-auto p-4">
          <div ref="wrapRef" class="relative mx-auto inline-block max-w-full">
            <img
              :key="imageSrc"
              ref="imgRef"
              :src="imageSrc"
              alt=""
              class="block max-h-[65vh] max-w-full object-contain"
              draggable="false"
              @load="onImgLoad"
            />

            <!-- Shade overlays -->
            <template v-if="imgReady">
              <div class="pointer-events-none absolute inset-0">
                <div class="pointer-events-none absolute bg-black/55" :style="{ left: 0, right: 0, top: 0, height: boxPx.top + 'px' }" />
                <div class="pointer-events-none absolute bg-black/55" :style="{ left: 0, right: 0, top: (boxPx.top + boxPx.height) + 'px', bottom: 0 }" />
                <div class="pointer-events-none absolute bg-black/55" :style="{ left: 0, width: boxPx.left + 'px', top: boxPx.top + 'px', height: boxPx.height + 'px' }" />
                <div class="pointer-events-none absolute bg-black/55" :style="{ left: (boxPx.left + boxPx.width) + 'px', right: 0, top: boxPx.top + 'px', height: boxPx.height + 'px' }" />
              </div>

              <!-- Crop box -->
              <div
                class="pointer-events-auto absolute z-[1] cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                :style="boxStyle"
                @pointerdown="(e) => onPointerDownCrop(e, 'move')"
              >
                <button type="button" tabindex="-1" aria-hidden class="crop-handle left-0 top-0 cursor-nwse-resize" @pointerdown.stop="(e) => onPointerDownCrop(e, 'nw')" />
                <button type="button" tabindex="-1" aria-hidden class="crop-handle left-1/2 top-0 -translate-x-1/2 cursor-ns-resize" @pointerdown.stop="(e) => onPointerDownCrop(e, 'n')" />
                <button type="button" tabindex="-1" aria-hidden class="crop-handle right-0 top-0 cursor-nesw-resize" @pointerdown.stop="(e) => onPointerDownCrop(e, 'ne')" />
                <button type="button" tabindex="-1" aria-hidden class="crop-handle right-0 top-1/2 -translate-y-1/2 cursor-ew-resize" @pointerdown.stop="(e) => onPointerDownCrop(e, 'e')" />
                <button type="button" tabindex="-1" aria-hidden class="crop-handle right-0 bottom-0 cursor-nwse-resize" @pointerdown.stop="(e) => onPointerDownCrop(e, 'se')" />
                <button type="button" tabindex="-1" aria-hidden class="crop-handle bottom-0 left-1/2 -translate-x-1/2 cursor-ns-resize" @pointerdown.stop="(e) => onPointerDownCrop(e, 's')" />
                <button type="button" tabindex="-1" aria-hidden class="crop-handle bottom-0 left-0 cursor-nesw-resize" @pointerdown.stop="(e) => onPointerDownCrop(e, 'sw')" />
                <button type="button" tabindex="-1" aria-hidden class="crop-handle left-0 top-1/2 -translate-y-1/2 cursor-ew-resize" @pointerdown.stop="(e) => onPointerDownCrop(e, 'w')" />
              </div>
            </template>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 border-t border-black/10 px-4 py-3">
          <button
            type="button"
            class="rounded-lg border border-black/10 bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-black/[0.04]"
            @click="emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="natural.w <= 0"
            class="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-40"
            @click="onApply"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Apply crop
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const MIN_SIDE = 12
const HANDLE_PX = 9

type CropRect = { x: number; y: number; w: number; h: number }
type DragKind = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export type ImageCropModalApplyPayload = {
  cropX: number
  cropY: number
  width: number
  height: number
}

const props = defineProps<{
  open: boolean
  imageSrc: string
  initialCrop: CropRect
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'apply', rect: ImageCropModalApplyPayload): void
}>()

const wrapRef = ref<HTMLDivElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)

const natural = ref({ w: 0, h: 0 })
const crop = ref<CropRect>({ ...props.initialCrop })
const layoutRev = ref(0)

const boxPx = ref({ left: 0, top: 0, width: 0, height: 0 })

type DragState = {
  kind: DragKind
  startClientX: number
  startClientY: number
  start: CropRect
  scale: number
} | null

const drag = ref<DragState>(null)

function clampCrop(r: CropRect, nw: number, nh: number): CropRect {
  let { x, y, w, h } = r
  x = Math.max(0, Math.min(x, nw - MIN_SIDE))
  y = Math.max(0, Math.min(y, nh - MIN_SIDE))
  w = Math.max(MIN_SIDE, Math.min(w, nw - x))
  h = Math.max(MIN_SIDE, Math.min(h, nh - y))
  return { x, y, w, h }
}

function recomputeBoxPx() {
  const img = imgRef.value
  if (!props.open || !img || natural.value.w <= 0) {
    boxPx.value = { left: 0, top: 0, width: 0, height: 0 }
    return
  }
  const rw = img.getBoundingClientRect().width
  const scale = rw / natural.value.w
  const c = crop.value
  boxPx.value = {
    left: c.x * scale,
    top: c.y * scale,
    width: c.w * scale,
    height: c.h * scale,
  }
}

const imgReady = computed(() => natural.value.w > 0 && !!imgRef.value)

const boxStyle = computed(() => {
  if (!imgReady.value) return { display: 'none' }
  return {
    left: boxPx.value.left + 'px',
    top: boxPx.value.top + 'px',
    width: boxPx.value.width + 'px',
    height: boxPx.value.height + 'px',
  }
})

watch(
  () => [props.open, props.initialCrop.x, props.initialCrop.y, props.initialCrop.w, props.initialCrop.h],
  () => {
    if (!props.open) {
      natural.value = { w: 0, h: 0 }
      return
    }
    crop.value = { ...props.initialCrop }
  },
)

watch(
  [() => props.open, () => natural.value.w, () => crop.value.x, () => crop.value.y, () => crop.value.w, () => crop.value.h, layoutRev],
  () => {
    nextTick(recomputeBoxPx)
  },
)

function onImgLoad() {
  const el = imgRef.value
  if (!el) return
  const nw = el.naturalWidth
  const nh = el.naturalHeight
  if (nw <= 0 || nh <= 0) return
  natural.value = { w: nw, h: nh }
  crop.value = clampCrop({ ...props.initialCrop }, nw, nh)
  layoutRev.value++
}

function onPointerDownCrop(e: PointerEvent, kind: DragKind) {
  e.preventDefault()
  e.stopPropagation()
  const img = imgRef.value
  if (!img || natural.value.w <= 0) return
  const scale = img.getBoundingClientRect().width / natural.value.w
  drag.value = {
    kind,
    startClientX: e.clientX,
    startClientY: e.clientY,
    start: { ...crop.value },
    scale,
  }
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  const d = drag.value
  if (!d || natural.value.w <= 0 || natural.value.h <= 0) return
  const dx = (e.clientX - d.startClientX) / d.scale
  const dy = (e.clientY - d.startClientY) / d.scale
  const s = d.start
  let next: CropRect = { ...s }

  if (d.kind === 'move') {
    next.x = s.x + dx
    next.y = s.y + dy
  } else {
    if (d.kind.includes('e')) next.w = s.w + dx
    if (d.kind.includes('w')) { next.x = s.x + dx; next.w = s.w - dx }
    if (d.kind.includes('s')) next.h = s.h + dy
    if (d.kind.includes('n')) { next.y = s.y + dy; next.h = s.h - dy }
  }

  if (next.w < MIN_SIDE) {
    if (d.kind.includes('w')) next.x = s.x + s.w - MIN_SIDE
    next.w = MIN_SIDE
  }
  if (next.h < MIN_SIDE) {
    if (d.kind.includes('n')) next.y = s.y + s.h - MIN_SIDE
    next.h = MIN_SIDE
  }

  crop.value = clampCrop(next, natural.value.w, natural.value.h)
}

function onPointerUp() {
  drag.value = null
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
}

function onWindowResize() {
  layoutRev.value++
}

let ro: ResizeObserver | null = null

watch(() => props.open, (open) => {
  if (!open) return
  nextTick(() => {
    if (wrapRef.value && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => { layoutRev.value++ })
      ro.observe(wrapRef.value)
    }
  })
}, { immediate: true })

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', onWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', onWindowResize)
  ro?.disconnect()
})

function onApply() {
  emit('apply', {
    cropX: crop.value.x,
    cropY: crop.value.y,
    width: crop.value.w,
    height: crop.value.h,
  })
}
</script>

<style scoped>
.crop-handle {
  position: absolute;
  z-index: 10;
  box-sizing: border-box;
  border-radius: 2px;
  border: 2px solid white;
  background: var(--accent, #6366f1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  width: v-bind('HANDLE_PX + "px"');
  height: v-bind('HANDLE_PX + "px"');
  margin: v-bind('(-HANDLE_PX / 2) + "px"');
}
</style>
