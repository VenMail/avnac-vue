<template>
  <div
    v-if="open"
    data-avnac-chrome
    class="pointer-events-auto fixed z-40 flex w-[min(100vw-1.5rem,340px)] max-h-[min(92dvh,720px)] flex-col overflow-hidden rounded-3xl border border-black/[0.08] bg-white/95 backdrop-blur-md"
    :style="panelStyle"
    role="dialog"
    aria-label="Templates"
  >
    <div class="flex shrink-0 items-center justify-between border-b border-black/[0.06] px-3 py-2">
      <div class="text-sm font-semibold text-neutral-800">Slide Templates</div>
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 hover:bg-black/[0.06]"
        aria-label="Close"
        @click="emit('close')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
      <p class="text-[11px] text-neutral-400">Click a template to apply it to the current slide.</p>

      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="tpl in templates"
          :key="tpl.id"
          class="flex flex-col gap-2 rounded-2xl border border-black/[0.08] bg-neutral-50 p-2.5 text-left hover:border-black/[0.18] hover:bg-white"
          @click="applyTemplate(tpl)"
        >
          <!-- Mini preview -->
          <div
            class="flex w-full items-center justify-center rounded-xl"
            style="aspect-ratio:16/9"
            :style="{ background: tpl.previewBg }"
          >
            <component :is="tpl.icon" />
          </div>
          <div class="text-[11px] font-medium text-neutral-700">{{ tpl.name }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import type { AvnacDocumentV1 } from '#/lib/avnac-document'

const W = 4000
const H = 2250
const PAD = 240

const props = defineProps<{
  open: boolean
  panelLeft?: string
  panelTop?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'template-insert', doc: AvnacDocumentV1): void
}>()

const panelStyle = computed(() => ({
  left: props.panelLeft ?? '4rem',
  top: props.panelTop ?? '4rem',
}))

function textbox(opts: {
  left: number; top: number; width: number; height: number
  text: string; fontSize: number; fontWeight?: string
  fill?: string; textAlign?: string
}): Record<string, unknown> {
  return {
    type: 'Textbox',
    version: '6.6.1',
    left: opts.left,
    top: opts.top,
    width: opts.width,
    height: opts.height,
    text: opts.text,
    fontSize: opts.fontSize,
    fontWeight: opts.fontWeight ?? 'normal',
    fontStyle: 'normal',
    fontFamily: 'Inter',
    fill: opts.fill ?? '#1a1a1a',
    textAlign: opts.textAlign ?? 'left',
    lineHeight: 1.3,
    selectable: true, evented: true, visible: true, editable: true,
    opacity: 1, angle: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0,
    flipX: false, flipY: false, originX: 'left', originY: 'top',
    stroke: null, strokeWidth: 1, strokeDashArray: null,
    paintFirst: 'fill', globalCompositeOperation: 'source-over', shadow: null,
  }
}

function rect(opts: {
  left: number; top: number; width: number; height: number
  fill: string; rx?: number; opacity?: number
}): Record<string, unknown> {
  return {
    type: 'Rect',
    version: '6.6.1',
    left: opts.left,
    top: opts.top,
    width: opts.width,
    height: opts.height,
    fill: opts.fill,
    stroke: null, strokeWidth: 1, rx: opts.rx ?? 0, ry: opts.rx ?? 0,
    selectable: true, evented: true, visible: true,
    opacity: opts.opacity ?? 1, angle: 0, scaleX: 1, scaleY: 1,
    skewX: 0, skewY: 0, flipX: false, flipY: false,
    originX: 'left', originY: 'top',
    globalCompositeOperation: 'source-over', shadow: null,
  }
}

function doc(bg: string, objects: Record<string, unknown>[]): AvnacDocumentV1 {
  return {
    v: 1,
    artboard: { width: W, height: H },
    bg: { type: 'solid', color: bg } as any,
    fabric: { version: '6.6.1', objects },
  }
}

// SVG icon helpers for mini previews
function TitleIcon() {
  return h('svg', { width: 40, height: 28, viewBox: '0 0 40 28', fill: 'none' }, [
    h('rect', { x: 8, y: 8, width: 24, height: 5, rx: 1, fill: '#fff', opacity: 0.9 }),
    h('rect', { x: 12, y: 16, width: 16, height: 3, rx: 1, fill: '#fff', opacity: 0.5 }),
  ])
}
function TwoColIcon() {
  return h('svg', { width: 40, height: 28, viewBox: '0 0 40 28', fill: 'none' }, [
    h('rect', { x: 4, y: 6, width: 14, height: 16, rx: 2, fill: '#fff', opacity: 0.6 }),
    h('rect', { x: 22, y: 6, width: 14, height: 16, rx: 2, fill: '#fff', opacity: 0.6 }),
  ])
}
function SectionIcon() {
  return h('svg', { width: 40, height: 28, viewBox: '0 0 40 28', fill: 'none' }, [
    h('rect', { x: 4, y: 9, width: 32, height: 6, rx: 1, fill: '#fff', opacity: 0.9 }),
    h('rect', { x: 4, y: 18, width: 18, height: 3, rx: 1, fill: '#fff', opacity: 0.4 }),
  ])
}
function BulletIcon() {
  return h('svg', { width: 40, height: 28, viewBox: '0 0 40 28', fill: 'none' }, [
    h('circle', { cx: 8, cy: 8, r: 2, fill: '#fff', opacity: 0.8 }),
    h('rect', { x: 13, y: 6, width: 22, height: 3, rx: 1, fill: '#fff', opacity: 0.7 }),
    h('circle', { cx: 8, cy: 14, r: 2, fill: '#fff', opacity: 0.8 }),
    h('rect', { x: 13, y: 12, width: 18, height: 3, rx: 1, fill: '#fff', opacity: 0.7 }),
    h('circle', { cx: 8, cy: 20, r: 2, fill: '#fff', opacity: 0.8 }),
    h('rect', { x: 13, y: 18, width: 20, height: 3, rx: 1, fill: '#fff', opacity: 0.7 }),
  ])
}
function QuoteIcon() {
  return h('svg', { width: 40, height: 28, viewBox: '0 0 40 28', fill: 'none' }, [
    h('path', { d: 'M8 10 C8 8 10 8 10 10 L10 14 L8 14 Z', fill: '#fff', opacity: 0.7 }),
    h('path', { d: 'M13 10 C13 8 15 8 15 10 L15 14 L13 14 Z', fill: '#fff', opacity: 0.7 }),
    h('rect', { x: 8, y: 16, width: 24, height: 3, rx: 1, fill: '#fff', opacity: 0.5 }),
  ])
}
function AccentIcon() {
  return h('svg', { width: 40, height: 28, viewBox: '0 0 40 28', fill: 'none' }, [
    h('rect', { x: 4, y: 4, width: 6, height: 20, rx: 2, fill: '#fff', opacity: 0.8 }),
    h('rect', { x: 14, y: 6, width: 20, height: 5, rx: 1, fill: '#fff', opacity: 0.9 }),
    h('rect', { x: 14, y: 14, width: 16, height: 3, rx: 1, fill: '#fff', opacity: 0.5 }),
    h('rect', { x: 14, y: 19, width: 12, height: 3, rx: 1, fill: '#fff', opacity: 0.4 }),
  ])
}

interface Template {
  id: string
  name: string
  previewBg: string
  make: () => AvnacDocumentV1
  icon: () => ReturnType<typeof h>
}

const templates: Template[] = [
  {
    id: 'title',
    name: 'Title slide',
    previewBg: '#6366f1',
    icon: TitleIcon,
    make: () => doc('#6366f1', [
      textbox({ left: PAD, top: 780, width: W - PAD * 2, height: 400, text: 'Presentation Title', fontSize: 140, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center' }),
      textbox({ left: PAD, top: 1220, width: W - PAD * 2, height: 200, text: 'Subtitle or author · Date', fontSize: 56, fill: 'rgba(255,255,255,0.7)', textAlign: 'center' }),
    ]),
  },
  {
    id: 'two-col',
    name: 'Two columns',
    previewBg: '#f8f8f8',
    icon: TwoColIcon,
    make: () => doc('#f8f9fa', [
      textbox({ left: PAD, top: 160, width: W - PAD * 2, height: 260, text: 'Section Title', fontSize: 96, fontWeight: 'bold', fill: '#111111' }),
      rect({ left: PAD, top: 500, width: (W - PAD * 3) / 2, height: 1500, fill: '#ffffff', rx: 24 }),
      rect({ left: PAD * 2 + (W - PAD * 3) / 2, top: 500, width: (W - PAD * 3) / 2, height: 1500, fill: '#ffffff', rx: 24 }),
      textbox({ left: PAD + 60, top: 580, width: (W - PAD * 3) / 2 - 120, height: 200, text: 'Column A', fontSize: 64, fontWeight: 'bold', fill: '#111111' }),
      textbox({ left: PAD + 60, top: 800, width: (W - PAD * 3) / 2 - 120, height: 600, text: 'Add your content here. This column works well for comparing two topics side by side.', fontSize: 44, fill: '#555555' }),
      textbox({ left: PAD * 2 + (W - PAD * 3) / 2 + 60, top: 580, width: (W - PAD * 3) / 2 - 120, height: 200, text: 'Column B', fontSize: 64, fontWeight: 'bold', fill: '#111111' }),
      textbox({ left: PAD * 2 + (W - PAD * 3) / 2 + 60, top: 800, width: (W - PAD * 3) / 2 - 120, height: 600, text: 'Add your content here. Keep each column focused on a single idea.', fontSize: 44, fill: '#555555' }),
    ]),
  },
  {
    id: 'section',
    name: 'Section header',
    previewBg: '#111111',
    icon: SectionIcon,
    make: () => doc('#111111', [
      rect({ left: 0, top: H / 2 - 12, width: W, height: 24, fill: '#6366f1' }),
      textbox({ left: PAD, top: H / 2 - 340, width: W - PAD * 2, height: 300, text: '01', fontSize: 200, fontWeight: 'bold', fill: '#6366f1', textAlign: 'center' }),
      textbox({ left: PAD, top: H / 2 + 60, width: W - PAD * 2, height: 280, text: 'Section Title', fontSize: 120, fontWeight: 'bold', fill: '#ffffff', textAlign: 'center' }),
    ]),
  },
  {
    id: 'bullets',
    name: 'Bullet list',
    previewBg: '#ffffff',
    icon: BulletIcon,
    make: () => doc('#ffffff', [
      textbox({ left: PAD, top: 160, width: W - PAD * 2, height: 260, text: 'Key Points', fontSize: 96, fontWeight: 'bold', fill: '#111111' }),
      rect({ left: PAD, top: 460, width: 12, height: 1500, fill: '#6366f1', rx: 6 }),
      textbox({ left: PAD + 80, top: 500, width: W - PAD * 2 - 80, height: 280, text: '• First key point goes here', fontSize: 56, fill: '#222222' }),
      textbox({ left: PAD + 80, top: 820, width: W - PAD * 2 - 80, height: 280, text: '• Second key point to highlight', fontSize: 56, fill: '#222222' }),
      textbox({ left: PAD + 80, top: 1140, width: W - PAD * 2 - 80, height: 280, text: '• Third key point for your audience', fontSize: 56, fill: '#222222' }),
      textbox({ left: PAD + 80, top: 1460, width: W - PAD * 2 - 80, height: 280, text: '• Fourth point to drive home', fontSize: 56, fill: '#222222' }),
    ]),
  },
  {
    id: 'quote',
    name: 'Quote',
    previewBg: '#1e1e2e',
    icon: QuoteIcon,
    make: () => doc('#1e1e2e', [
      textbox({ left: PAD, top: 300, width: 200, height: 400, text: '“', fontSize: 400, fontWeight: 'bold', fill: '#6366f1' }),
      textbox({ left: PAD + 80, top: 600, width: W - PAD * 2 - 80, height: 700, text: 'Your quote or key message goes here. Make it memorable and impactful.', fontSize: 72, fill: '#ffffff', textAlign: 'center' }),
      textbox({ left: PAD, top: 1380, width: W - PAD * 2, height: 160, text: '— Attribution Name', fontSize: 52, fill: 'rgba(255,255,255,0.55)', textAlign: 'center' }),
    ]),
  },
  {
    id: 'accent-left',
    name: 'Accent bar',
    previewBg: '#f4f4f5',
    icon: AccentIcon,
    make: () => doc('#f4f4f5', [
      rect({ left: 0, top: 0, width: 300, height: H, fill: '#6366f1' }),
      textbox({ left: 400, top: 200, width: W - 500, height: 300, text: 'Slide Title', fontSize: 110, fontWeight: 'bold', fill: '#111111' }),
      textbox({ left: 400, top: 560, width: W - 500, height: 1200, text: 'Add your main content here. This layout works well for data-heavy slides with a bold visual anchor on the left side.', fontSize: 56, fill: '#444444', lineHeight: 1.5 } as any),
    ]),
  },
]

function applyTemplate(tpl: Template) {
  emit('template-insert', tpl.make())
  emit('close')
}
</script>
