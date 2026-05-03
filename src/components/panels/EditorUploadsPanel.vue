<template>
  <div
    v-if="open"
    data-avnac-chrome
    class="avnac-panel avnac-uploads-panel pointer-events-auto fixed z-40 flex w-[min(100vw-1.5rem,340px)] max-h-[min(92dvh,720px)] flex-col overflow-hidden rounded-3xl border border-black/[0.08] bg-white/95 backdrop-blur-md"
    :style="panelStyle"
    role="dialog"
    aria-label="Uploads"
  >
    <div class="avnac-panel__header flex shrink-0 items-center justify-between border-b border-black/[0.06] px-3 py-2">
      <div class="text-sm font-semibold text-neutral-800">Uploads</div>
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

    <div
      class="avnac-panel__body flex flex-1 flex-col gap-3 overflow-y-auto p-3"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <button
        type="button"
        class="avnac-panel__drop flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-[13px] font-medium text-neutral-700 hover:border-black/[0.25] hover:bg-neutral-100"
        :class="isDragging ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-black/[0.15] bg-neutral-50'"
        @click="pickFile"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
        Upload or drop image
      </button>

      <p class="text-center text-[11px] text-neutral-400">
        Supports JPEG, PNG, WebP, SVG, GIF
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  panelLeft?: string
  panelTop?: string
  onAddImageFromFile?: (file: File) => void
}>()

const emit = defineEmits<{ (e: 'close'): void }>()
const isDragging = ref(false)

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !props.open) return
  event.preventDefault()
  emit('close')
}

watch(() => props.open, (open) => {
  if (open) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

const panelStyle = computed(() => ({
  left: props.panelLeft ?? '4rem',
  top: props.panelTop ?? '4rem',
}))

function pickFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = false
  input.onchange = () => {
    addFile(input.files?.[0])
  }
  input.click()
}

function addFile(file: File | null | undefined) {
  if (!file || !file.type.startsWith('image/')) return
  props.onAddImageFromFile?.(file)
  emit('close')
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  addFile(event.dataTransfer?.files?.[0])
}
</script>

<style scoped>
.avnac-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(calc(100vw - 1.5rem), 340px);
  max-height: min(92dvh, 720px);
  overflow: hidden;
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  color: #171717;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(12px);
}
.avnac-panel__header {
  min-height: 44px;
  border-color: rgba(17, 24, 39, 0.1);
  background: #ffffff;
}
.avnac-panel__body {
  min-height: 0;
  overflow-y: auto;
  background: #ffffff;
}
.avnac-panel__close {
  border: 1px solid rgba(17, 24, 39, 0.08);
  background: #ffffff;
  color: #404040;
  cursor: pointer;
}
.avnac-panel__close:hover {
  background: #f5f5f5;
  color: #111827;
}
.avnac-panel__drop {
  min-height: 96px;
  border-color: rgba(17, 24, 39, 0.2);
  background: #fafafa;
  color: #404040;
  cursor: pointer;
}
.avnac-panel__drop:hover {
  border-color: rgba(17, 24, 39, 0.35);
  background: #f5f5f5;
  color: #111827;
}
</style>
