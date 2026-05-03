<template>
  <div
    v-if="open"
    data-avnac-chrome
    class="avnac-panel avnac-ai-panel pointer-events-auto fixed z-40 flex w-[min(100vw-1.5rem,360px)] max-h-[min(92dvh,720px)] flex-col overflow-hidden rounded-3xl border border-black/[0.08] bg-white/95 backdrop-blur-md"
    :style="panelStyle"
    role="dialog"
    aria-label="AI Slide Generator"
  >
    <!-- Header -->
    <div class="avnac-panel__header flex shrink-0 items-center justify-between border-b border-black/[0.06] px-3 py-2">
      <div class="flex items-center gap-2">
        <div class="flex h-6 w-6 items-center justify-center rounded-lg" style="background:var(--accent,#6366f1)1a">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent,#6366f1)" stroke-width="1.75">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
          </svg>
        </div>
        <div class="text-sm font-semibold text-neutral-800">AI Slide Generator</div>
      </div>
      <button
        type="button"
        class="avnac-panel__close flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 hover:bg-black/[0.06]"
        aria-label="Close"
        @click="emit('close')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Body -->
    <div class="avnac-panel__body flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <!-- Prompt -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[12px] font-medium text-neutral-700">Describe your slide</label>
        <textarea
          v-model="prompt"
          placeholder="A professional product launch presentation with bold visuals..."
          rows="4"
          maxlength="2000"
          class="avnac-panel__textarea resize-none rounded-xl border border-black/[0.12] bg-neutral-50 px-3 py-2.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-[var(--accent,#6366f1)] focus:outline-none"
        />
        <div class="text-right text-[11px] text-neutral-400">{{ prompt.length }} / 2000</div>
      </div>

      <!-- Options row -->
      <div class="flex gap-3">
        <!-- Scene count -->
        <div class="flex flex-1 flex-col gap-1.5">
          <label class="text-[12px] font-medium text-neutral-700">Slides</label>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="avnac-panel__icon-button flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/[0.1] bg-white text-neutral-700 hover:bg-neutral-50"
              @click="sceneCount = Math.max(2, sceneCount - 1)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <div class="avnac-panel__count flex-1 rounded-lg border border-black/[0.1] bg-white py-1.5 text-center text-[13px] font-medium text-neutral-900">{{ sceneCount }}</div>
            <button
              type="button"
              class="avnac-panel__icon-button flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/[0.1] bg-white text-neutral-700 hover:bg-neutral-50"
              @click="sceneCount = Math.min(15, sceneCount + 1)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>

        <!-- Style -->
        <div class="flex flex-1 flex-col gap-1.5">
          <label class="text-[12px] font-medium text-neutral-700">Style</label>
          <select
            v-model="style"
            class="avnac-panel__select h-8 rounded-lg border border-black/[0.1] bg-white px-2 text-[13px] text-neutral-900 focus:outline-none"
          >
            <option value="modern">Modern</option>
            <option value="bold">Bold</option>
            <option value="minimal">Minimal</option>
            <option value="dark">Dark</option>
            <option value="playful">Playful</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="avnac-panel__error rounded-xl bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
        {{ error }}
      </div>

      <!-- Generated results -->
      <div v-if="generatedDocs.length" class="flex flex-col gap-2">
        <div class="text-[12px] font-medium text-neutral-700">
          Generated {{ generatedDocs.length }} slide{{ generatedDocs.length !== 1 ? 's' : '' }}
        </div>
        <div class="flex flex-col gap-1.5">
          <button
            v-for="(doc, i) in generatedDocs"
            :key="i"
            class="flex items-center gap-2.5 rounded-xl border border-black/[0.08] bg-neutral-50 px-3 py-2 text-left hover:bg-neutral-100"
            @click="applySlide(i)"
          >
            <div
              class="flex h-8 w-12 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
              :style="{ background: getSlideAccent(doc) }"
            >
              {{ i + 1 }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-[12px] font-medium text-neutral-800">{{ getSlideTitle(doc) || `Slide ${i + 1}` }}</div>
              <div class="text-[11px] text-neutral-500">{{ getObjectCount(doc) }} object{{ getObjectCount(doc) !== 1 ? 's' : '' }}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="shrink-0 text-neutral-400">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <button
          class="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium text-white"
          style="background:var(--accent,#6366f1)"
          @click="applyAll"
        >
          Apply all {{ generatedDocs.length }} slides
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="avnac-panel__footer shrink-0 border-t border-black/[0.06] p-3">
      <button
        type="button"
        :disabled="loading || prompt.trim().length < 5"
        class="avnac-panel__primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
        style="background:var(--accent,#6366f1)"
        @click="generate"
      >
        <template v-if="loading">
          <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Generating…
        </template>
        <template v-else>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
          </svg>
          Generate slides
        </template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { AvnacDocumentV1 } from '#/lib/avnac-document'

const ARTBOARD_W = 4000
const ARTBOARD_H = 2250
const SOURCE_W = 1920
const SCALE = ARTBOARD_W / SOURCE_W

const props = defineProps<{
  open: boolean
  panelLeft?: string
  panelTop?: string
  apiUrl?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'generate', docs: AvnacDocumentV1[]): void
}>()

const panelStyle = computed(() => ({
  left: props.panelLeft ?? '4rem',
  top: props.panelTop ?? '4rem',
}))

const prompt = ref('')
const sceneCount = ref(5)
const style = ref('modern')
const loading = ref(false)
const error = ref<string | null>(null)
const generatedDocs = ref<AvnacDocumentV1[]>([])

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !props.open) return
  event.preventDefault()
  emit('close')
}

watch(() => props.open, (open) => {
  if (open) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
}, { immediate: true })

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

function getToken(): string | null {
  return localStorage.getItem('venAuthToken')
}

function resolveApiUrl(): string {
  if (props.apiUrl) return props.apiUrl
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000/api/v1'
  return `${base}/ai/generate-slides`
}

interface StoryBlock {
  type: string
  content: Record<string, unknown>
  position: { x: number; y: number; width: number; height: number }
  style?: Record<string, unknown>
}

interface StoryScene {
  name: string
  background: { type: string; value: string }
  blocks: StoryBlock[]
}

interface StoryResponse {
  data: {
    title: string
    theme: string
    scenes: StoryScene[]
  }
}

function validateResponse(data: unknown): data is StoryResponse {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (!d.data || typeof d.data !== 'object') return false
  const inner = d.data as Record<string, unknown>
  if (!Array.isArray(inner.scenes) || inner.scenes.length === 0) return false
  for (const scene of inner.scenes as unknown[]) {
    if (!scene || typeof scene !== 'object') return false
    const s = scene as Record<string, unknown>
    if (!Array.isArray(s.blocks)) return false
    if (!s.background || typeof s.background !== 'object') return false
  }
  return true
}

function htmlToPlainText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent ?? div.innerText ?? '').trim()
}

function sceneToDoc(scene: StoryScene): AvnacDocumentV1 {
  const objects: Record<string, unknown>[] = []
  let bgColor = '#ffffff'

  const bg = scene.background
  if (bg.type === 'solid') {
    bgColor = bg.value || '#ffffff'
  } else if (bg.type === 'gradient') {
    const match = bg.value.match(/#[0-9a-fA-F]{3,8}/)
    bgColor = match ? match[0] : '#1a1a2e'
  }

  for (const block of scene.blocks) {
    const p = block.position
    const x = Math.round(p.x * SCALE)
    const y = Math.round(p.y * SCALE)
    const w = Math.round(p.width * SCALE)
    const h = Math.round(p.height * SCALE)
    const c = block.content as Record<string, unknown>

    if (block.type === 'heading' || block.type === 'text') {
      const rawText = typeof c.html === 'string'
        ? htmlToPlainText(c.html)
        : String(c.text ?? '')
      if (!rawText.trim()) continue
      const fontSize = typeof c.fontSize === 'number'
        ? Math.round(c.fontSize * SCALE)
        : block.type === 'heading' ? 80 : 40
      const isBold = c.fontWeight === '700' || c.fontWeight === 'bold' || block.type === 'heading'
      const fill = typeof c.color === 'string' ? c.color : '#1a1a1a'
      const textAlign = typeof c.textAlign === 'string' ? c.textAlign : 'left'

      objects.push({
        type: 'Textbox',
        version: '6.6.1',
        left: x,
        top: y,
        width: w,
        height: h,
        text: rawText,
        fontSize,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: 'normal',
        fontFamily: 'Inter',
        fill,
        textAlign,
        lineHeight: 1.3,
        lockScalingFlip: true,
        editable: true,
        selectable: true,
        evented: true,
        visible: true,
        opacity: 1,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        flipX: false,
        flipY: false,
        originX: 'left',
        originY: 'top',
        strokeWidth: 1,
        strokeDashArray: null,
        stroke: null,
        paintFirst: 'fill',
        globalCompositeOperation: 'source-over',
        shadow: null,
      })
    } else if (block.type === 'shape') {
      const fill = typeof c.backgroundColor === 'string'
        ? c.backgroundColor
        : typeof c.color === 'string'
        ? c.color
        : '#6366f1'
      objects.push({
        type: 'Rect',
        version: '6.6.1',
        left: x,
        top: y,
        width: w,
        height: h,
        fill,
        stroke: null,
        strokeWidth: 1,
        rx: 12,
        ry: 12,
        lockScalingFlip: true,
        selectable: true,
        evented: true,
        visible: true,
        opacity: 1,
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        flipX: false,
        flipY: false,
        originX: 'left',
        originY: 'top',
        globalCompositeOperation: 'source-over',
        shadow: null,
      })
    }
  }

  return {
    v: 1,
    artboard: { width: ARTBOARD_W, height: ARTBOARD_H },
    bg: { type: 'solid', color: bgColor } as any,
    fabric: { version: '6.6.1', objects },
  }
}

async function generate() {
  if (prompt.value.trim().length < 5) return
  error.value = null
  loading.value = true
  generatedDocs.value = []

  try {
    const token = getToken()
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const resp = await fetch(resolveApiUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: prompt.value.trim(),
        slide_count: sceneCount.value,
        scene_count: sceneCount.value,
        style: style.value,
      }),
    })

    const rawText = await resp.text()
    let json: unknown = null
    if (rawText.trim()) {
      try {
        json = JSON.parse(rawText)
      } catch {
        const prefix = rawText.replace(/\s+/g, ' ').slice(0, 120)
        throw new Error(resp.ok
          ? `AI returned malformed JSON: ${prefix}`
          : `AI request failed (${resp.status}). The server returned a non-JSON response.`)
      }
    }

    if (!resp.ok) {
      const errMsg = ((json as any)?.error?.message as string | undefined) ?? `Request failed (${resp.status})`
      error.value = errMsg
      return
    }

    if (!validateResponse(json)) {
      error.value = 'AI returned an unexpected response. Please try again.'
      return
    }

    generatedDocs.value = json.data.scenes.map(sceneToDoc)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}

function applySlide(index: number) {
  emit('generate', [generatedDocs.value[index]])
}

function applyAll() {
  emit('generate', [...generatedDocs.value])
}

function getSlideAccent(doc: AvnacDocumentV1): string {
  const bg = doc.bg as any
  return bg?.color ?? '#6366f1'
}

function getSlideTitle(doc: AvnacDocumentV1): string {
  const objects = (doc.fabric as any)?.objects ?? []
  const heading = objects.find((o: any) => o.type === 'Textbox' && o.fontWeight === 'bold')
    ?? objects.find((o: any) => o.type === 'Textbox')
  return (heading?.text as string | undefined)?.split('\n')[0]?.slice(0, 40) ?? ''
}

function getObjectCount(doc: AvnacDocumentV1): number {
  return ((doc.fabric as any)?.objects ?? []).length
}
</script>

<style scoped>
.avnac-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(calc(100vw - 1.5rem), 360px);
  max-height: min(92dvh, 720px);
  overflow: hidden;
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  color: #171717;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(12px);
}
.avnac-panel__header,
.avnac-panel__footer {
  border-color: rgba(17, 24, 39, 0.1);
  background: #ffffff;
}
.avnac-panel__header {
  min-height: 44px;
}
.avnac-panel__body {
  min-height: 0;
  overflow-y: auto;
  background: #ffffff;
}
.avnac-panel__close,
.avnac-panel__icon-button {
  border: 1px solid rgba(17, 24, 39, 0.08);
  background: #ffffff;
  color: #404040;
  cursor: pointer;
}
.avnac-panel__close:hover,
.avnac-panel__icon-button:hover {
  background: #f5f5f5;
  color: #111827;
}
.avnac-panel__textarea,
.avnac-panel__select,
.avnac-panel__count {
  border: 1px solid rgba(17, 24, 39, 0.14);
  background: #ffffff;
  color: #171717;
}
.avnac-panel__textarea::placeholder {
  color: #737373;
}
.avnac-panel__textarea:focus,
.avnac-panel__select:focus {
  border-color: var(--accent, #6366f1);
  outline: 2px solid color-mix(in srgb, var(--accent, #6366f1) 28%, transparent);
}
.avnac-panel__error {
  background: #fef2f2;
  color: #b91c1c;
}
.avnac-panel__primary {
  min-height: 44px;
  border: 0;
  background: var(--accent, #6366f1);
  color: #ffffff;
  cursor: pointer;
}
.avnac-panel__primary:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>
