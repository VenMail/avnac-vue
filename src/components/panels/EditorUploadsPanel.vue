<template>
  <div
    v-if="open"
    data-avnac-chrome
    class="pointer-events-auto fixed z-40 flex w-[min(100vw-1.5rem,340px)] max-h-[min(92dvh,720px)] flex-col overflow-hidden rounded-3xl border border-black/[0.08] bg-white/95 backdrop-blur-md"
    :style="panelStyle"
    role="dialog"
    aria-label="Uploads"
  >
    <div class="flex shrink-0 items-center justify-between border-b border-black/[0.06] px-3 py-2">
      <div class="text-sm font-semibold text-neutral-800">Uploads</div>
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
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/[0.15] bg-neutral-50 px-4 py-5 text-[13px] font-medium text-neutral-700 hover:border-black/[0.25] hover:bg-neutral-100"
        @click="pickFile"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
        Upload from device
      </button>

      <p class="text-center text-[11px] text-neutral-400">
        Supports JPEG, PNG, WebP, SVG, GIF
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  open: boolean
  panelLeft?: string
  panelTop?: string
  onAddImageFromFile?: (file: File) => void
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

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
    const file = input.files?.[0]
    if (!file) return
    props.onAddImageFromFile?.(file)
    emit('close')
  }
  input.click()
}
</script>
