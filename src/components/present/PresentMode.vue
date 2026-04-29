<template>
  <Teleport to="body">
    <Transition name="pm-fade">
      <div
        v-if="modelValue"
        class="pm-overlay"
        tabindex="-1"
        @keydown="onKeyDown"
        @click="onAdvance"
        ref="overlayRef"
      >
        <!-- Slide canvas -->
        <div class="pm-stage">
          <div class="pm-artboard" :style="artboardStyle">
            <canvas ref="canvasElRef" />
          </div>
        </div>

        <!-- Navigation overlay -->
        <div class="pm-nav" @click.stop>
          <span class="pm-counter">{{ currentIndex + 1 }} / {{ slides.length }}</span>
          <div class="pm-nav-btns">
            <button title="Previous slide (←)" @click="prevSlide">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button title="Next slide (→ or Space)" @click="nextSlide">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            <button title="Exit (Esc)" @click="emit('update:modelValue', false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import type { AvnacDocumentV1 } from '#/lib/avnac-document'

const props = defineProps<{
  modelValue: boolean
  slides: AvnacDocumentV1[]
  startIndex?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
}>()

const overlayRef = ref<HTMLDivElement | null>(null)
const canvasElRef = ref<HTMLCanvasElement | null>(null)
const currentIndex = ref(props.startIndex ?? 0)
let fabricCanvas: any = null
let timelineHandle: any = null

const PRESENT_W = 1280
const PRESENT_H = 720

const artboardStyle = computed(() => ({
  width: `${PRESENT_W}px`,
  height: `${PRESENT_H}px`,
}))

// Load a slide into the read-only fabric canvas
async function loadSlide(index: number) {
  const slide = props.slides[index]
  if (!slide || !fabricCanvas) return

  // Dispose any running timeline
  timelineHandle?.dispose()
  timelineHandle = null

  const [mod, { loadCanvasGoogleFontsAndRelayout }] = await Promise.all([
    import('fabric'),
    import('#/lib/avnac-canvas-google-fonts'),
  ])

  fabricCanvas.clear()
  fabricCanvas.selection = false

  const scale = PRESENT_W / slide.artboard.width
  fabricCanvas.setDimensions({ width: PRESENT_W, height: PRESENT_H })
  fabricCanvas.setViewportTransform([scale, 0, 0, scale, 0, 0])

  const fabricData = slide.fabric as { objects?: unknown[] }
  if (fabricData.objects?.length) {
    const objects = await mod.util.enlivenObjects(fabricData.objects)
    for (const o of objects as any[]) {
      o.selectable = false
      o.evented = false
      fabricCanvas.add(o)
    }
  }
  fabricCanvas.requestRenderAll()
  await loadCanvasGoogleFontsAndRelayout(fabricCanvas, mod as any)

  // Start animations
  const { playSlideAnimations } = await import('#/lib/avnac-animation-runtime')
  timelineHandle = playSlideAnimations(fabricCanvas)
}

async function initCanvas() {
  const el = canvasElRef.value
  if (!el) return
  const mod = await import('fabric')
  fabricCanvas = new mod.Canvas(el, {
    width: PRESENT_W,
    height: PRESENT_H,
    selection: false,
    interactive: false,
  })
  await loadSlide(currentIndex.value)
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      currentIndex.value = props.startIndex ?? 0
      await nextTick()
      await initCanvas()
      // Focus overlay for keyboard events
      overlayRef.value?.focus()
    } else {
      timelineHandle?.dispose()
      timelineHandle = null
      fabricCanvas?.dispose()
      fabricCanvas = null
    }
  },
)

function prevSlide() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    loadSlide(currentIndex.value)
  }
}

function nextSlide() {
  if (currentIndex.value < props.slides.length - 1) {
    currentIndex.value++
    loadSlide(currentIndex.value)
  } else {
    emit('update:modelValue', false)
  }
}

function onAdvance() {
  // Click on stage → advance timeline first; then next slide
  if (timelineHandle) {
    timelineHandle.advance()
  } else {
    nextSlide()
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') { emit('update:modelValue', false); return }
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); return }
  if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide() }
}

onBeforeUnmount(() => {
  timelineHandle?.dispose()
  fabricCanvas?.dispose()
})
</script>

<style scoped>
.pm-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  cursor: pointer;
}
.pm-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.pm-artboard {
  position: relative;
  flex-shrink: 0;
  /* Scale to fit viewport */
  max-width: 100vw;
  max-height: 100vh;
  box-shadow: 0 8px 48px rgba(0,0,0,0.5);
  transform-origin: center center;
}
.pm-nav {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0,0,0,0.62);
  border-radius: 24px;
  padding: 5px 14px;
  pointer-events: auto;
  cursor: default;
}
.pm-counter { font-size: 13px; color: rgba(255,255,255,0.7); min-width: 50px; text-align: center; }
.pm-nav-btns { display: flex; gap: 4px; }
.pm-nav-btns button {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; border: none;
  background: rgba(255,255,255,0.12); cursor: pointer; color: #fff;
}
.pm-nav-btns button:hover { background: rgba(255,255,255,0.22); }

.pm-fade-enter-active, .pm-fade-leave-active { transition: opacity 0.2s; }
.pm-fade-enter-from, .pm-fade-leave-to { opacity: 0; }
</style>
