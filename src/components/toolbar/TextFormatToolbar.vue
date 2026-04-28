<template>
  <div class="avnac-text-toolbar">
    <!-- Font family -->
    <div ref="fontRootRef" class="relative">
      <button
        class="avnac-font-family-btn"
        @click="toggleFontMenu"
      >
        <span :style="{ fontFamily: values.fontFamily }">{{ values.fontFamily }}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      <div
        v-if="fontMenuOpen"
        ref="fontPanelRef"
        class="avnac-font-menu"
        :class="fontMenuUpward ? 'bottom-full mb-1' : 'top-full mt-1'"
      >
        <input
          ref="fontSearchRef"
          type="text"
          placeholder="Search fonts…"
          class="avnac-font-search"
          :value="fontQuery"
          @input="fontQuery = ($event.target as HTMLInputElement).value"
        />
        <div class="avnac-font-list">
          <button
            v-for="font in filteredFonts"
            :key="font"
            class="avnac-font-item"
            :style="{ fontFamily: font }"
            @mouseenter="preloadFont(font)"
            @click="selectFont(font)"
          >{{ font }}</button>
        </div>
      </div>
    </div>

    <div class="avnac-divider" />

    <!-- Font size -->
    <FontSizeScrubber :value="values.fontSize" @change="emit('change', { fontSize: $event })" />

    <div class="avnac-divider" />

    <!-- Fill color -->
    <PaintPopoverControl :value="values.fillStyle" compact @change="emit('change', { fillStyle: $event })" title="Text color" />

    <div class="avnac-divider" />

    <!-- Alignment -->
    <button
      v-for="align in ALIGNS"
      :key="align.value"
      class="avnac-toolbar-btn"
      :class="{ active: values.textAlign === align.value }"
      :title="align.label"
      @click="emit('change', { textAlign: align.value as any })"
    >
      <span v-html="align.icon" />
    </button>

    <div class="avnac-divider" />

    <!-- Bold / Italic / Underline -->
    <button class="avnac-toolbar-btn font-bold text-sm" :class="{ active: values.bold }" title="Bold" @click="emit('change', { bold: !values.bold })">B</button>
    <button class="avnac-toolbar-btn italic text-sm" :class="{ active: values.italic }" title="Italic" @click="emit('change', { italic: !values.italic })">I</button>
    <button class="avnac-toolbar-btn underline text-sm" :class="{ active: values.underline }" title="Underline" @click="emit('change', { underline: !values.underline })">U</button>

    <div class="avnac-divider" />

    <!-- Line height -->
    <div ref="lhRootRef" class="relative">
      <button class="avnac-toolbar-btn" title="Line height" @click="toggleLineHeight">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div v-if="lhOpen" ref="lhPanelRef" class="absolute z-50 top-full mt-1 avnac-small-popover">
        <label class="text-xs text-[var(--fg-subtle,#737373)]">Line height</label>
        <EditorRangeSlider :value="Math.round(values.lineHeight * 10)" :min="8" :max="30" @change="emit('change', { lineHeight: $event / 10 })" />
        <span class="text-xs font-mono">{{ values.lineHeight.toFixed(1) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { TextFormatToolbarValues } from '#/stores/canvas'
import { loadGoogleFontFamily } from '#/lib/load-google-font'
import { useClickOutside } from '#/composables/useViewportPopover'
import FontSizeScrubber from '#/components/shared/FontSizeScrubber.vue'
import EditorRangeSlider from '#/components/shared/EditorRangeSlider.vue'
import PaintPopoverControl from '#/components/shared/PaintPopoverControl.vue'

const GOOGLE_FONT_FAMILIES = [
  'Inter','Roboto','Open Sans','Lato','Montserrat','Poppins','Raleway','Nunito','Source Sans Pro',
  'Ubuntu','Merriweather','Playfair Display','Lora','PT Serif','Libre Baskerville',
  'Oswald','Bebas Neue','Anton','Titan One','Pacifico','Dancing Script','Satisfy',
  'Caveat','Kalam','Patrick Hand','Permanent Marker','Rock Salt',
  'Fira Code','Source Code Pro','JetBrains Mono','Space Mono',
  'Barlow','Mulish','Quicksand','DM Sans','Karla','Figtree',
]

const ALIGNS = [
  { value: 'left', label: 'Align left', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>' },
  { value: 'center', label: 'Align center', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>' },
  { value: 'right', label: 'Align right', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>' },
  { value: 'justify', label: 'Justify', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' },
]

defineProps<{ values: TextFormatToolbarValues }>()
const emit = defineEmits<{ change: [partial: Partial<TextFormatToolbarValues>] }>()

// Font menu
const fontRootRef = ref<HTMLElement | null>(null)
const fontPanelRef = ref<HTMLElement | null>(null)
const fontSearchRef = ref<HTMLInputElement | null>(null)
const fontMenuOpen = ref(false)
const fontMenuUpward = ref(false)
const fontQuery = ref('')

const filteredFonts = computed(() => {
  const q = fontQuery.value.toLowerCase()
  const all = q ? GOOGLE_FONT_FAMILIES.filter((f) => f.toLowerCase().includes(q)) : GOOGLE_FONT_FAMILIES
  return all.slice(0, 80)
})

const { attach: attachFont, detach: detachFont } = useClickOutside(
  () => [fontRootRef.value, fontPanelRef.value],
  () => { fontMenuOpen.value = false; detachFont() },
)

function toggleFontMenu() {
  fontMenuOpen.value = !fontMenuOpen.value
  if (fontMenuOpen.value) {
    attachFont()
    fontQuery.value = ''
    nextTick(() => fontSearchRef.value?.focus())
    const rect = fontRootRef.value?.getBoundingClientRect()
    fontMenuUpward.value = rect ? (window.innerHeight - rect.bottom) < 300 : false
  } else {
    detachFont()
  }
}

function selectFont(font: string) {
  fontMenuOpen.value = false
  detachFont()
  emit('change', { fontFamily: font })
}

async function preloadFont(font: string) {
  try { await loadGoogleFontFamily(font) } catch { /* ignore */ }
}

// Line height popover
const lhRootRef = ref<HTMLElement | null>(null)
const lhPanelRef = ref<HTMLElement | null>(null)
const lhOpen = ref(false)

const { attach: attachLh, detach: detachLh } = useClickOutside(
  () => [lhRootRef.value, lhPanelRef.value],
  () => { lhOpen.value = false; detachLh() },
)

function toggleLineHeight() {
  lhOpen.value = !lhOpen.value
  if (lhOpen.value) attachLh()
  else detachLh()
}
</script>

<style scoped>
.avnac-text-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}
.avnac-divider {
  width: 1px;
  height: 20px;
  background: var(--border-default, #e0e0e0);
  margin: 0 4px;
  flex-shrink: 0;
}
.avnac-toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 4px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--fg-default, #262626);
  font-size: 13px;
}
.avnac-toolbar-btn:hover, .avnac-toolbar-btn.active {
  background: var(--bg-subtle, #f0f0f0);
}
.avnac-toolbar-btn.active {
  color: var(--fg-default, #262626);
  font-weight: 600;
}
.avnac-font-family-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  height: 28px;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.avnac-font-menu {
  position: absolute;
  z-index: 50;
  background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  width: 200px;
  overflow: hidden;
}
.avnac-font-search {
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-bottom: 1px solid var(--border-default, #e0e0e0);
  font-size: 12px;
  outline: none;
}
.avnac-font-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
}
.avnac-font-item {
  display: block;
  width: 100%;
  padding: 5px 8px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
}
.avnac-font-item:hover {
  background: var(--bg-subtle, #f5f5f5);
}
.avnac-small-popover {
  background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
}
</style>
