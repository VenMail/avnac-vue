<template>
  <div class="template-grid">
    <button
      v-for="t in TEMPLATES"
      :key="t.id"
      class="template-btn"
      :class="{ active: modelValue === t.id }"
      :title="t.label"
      @click="$emit('update:modelValue', t.id)"
    >
      <!-- SVG thumbnail preview for each template -->
      <svg :viewBox="'0 0 60 44'" width="60" height="44" class="thumb">
        <component :is="'g'" v-html="t.svg" />
      </svg>
      <span>{{ t.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { InfographicTemplate } from '#/lib/avnac-infographic'

defineProps<{ modelValue: InfographicTemplate | null }>()
defineEmits<{ 'update:modelValue': [v: InfographicTemplate] }>()

const TEMPLATES: Array<{ id: InfographicTemplate; label: string; svg: string }> = [
  {
    id: 'pyramid', label: 'Pyramid',
    svg: `<polygon points="30,4 54,40 6,40" fill="#4472c4" opacity=".9"/>
          <polygon points="30,14 46,40 14,40" fill="#ed7d31" opacity=".9"/>
          <polygon points="30,24 38,40 22,40" fill="#a9d18e" opacity=".9"/>`,
  },
  {
    id: 'funnel', label: 'Funnel',
    svg: `<polygon points="4,4 56,4 50,18 10,18" fill="#4472c4" opacity=".9"/>
          <polygon points="10,19 50,19 44,33 16,33" fill="#ed7d31" opacity=".9"/>
          <polygon points="16,34 44,34 38,44 22,44" fill="#a9d18e" opacity=".9"/>`,
  },
  {
    id: 'timeline-h', label: 'Timeline',
    svg: `<line x1="4" y1="22" x2="56" y2="22" stroke="#ccc" stroke-width="2"/>
          <circle cx="14" cy="22" r="6" fill="#4472c4"/>
          <circle cx="30" cy="22" r="6" fill="#ed7d31"/>
          <circle cx="46" cy="22" r="6" fill="#a9d18e"/>`,
  },
  {
    id: 'timeline-v', label: 'Vertical TL',
    svg: `<line x1="20" y1="4" x2="20" y2="40" stroke="#ccc" stroke-width="2"/>
          <circle cx="20" cy="10" r="5" fill="#4472c4"/>
          <circle cx="20" cy="22" r="5" fill="#ed7d31"/>
          <circle cx="20" cy="34" r="5" fill="#a9d18e"/>
          <text x="28" y="13" font-size="7" fill="#333">Step 1</text>
          <text x="28" y="25" font-size="7" fill="#333">Step 2</text>
          <text x="28" y="37" font-size="7" fill="#333">Step 3</text>`,
  },
  {
    id: 'chevron', label: 'Chevron',
    svg: `<polygon points="2,10 20,10 26,22 20,34 2,34 8,22" fill="#4472c4" opacity=".9"/>
          <polygon points="22,10 40,10 46,22 40,34 22,34 28,22" fill="#ed7d31" opacity=".9"/>
          <polygon points="42,10 58,10 58,34 42,34 48,22" fill="#a9d18e" opacity=".9"/>`,
  },
  {
    id: 'cycle', label: 'Cycle',
    svg: `<circle cx="30" cy="10" r="7" fill="#4472c4"/>
          <circle cx="48" cy="32" r="7" fill="#ed7d31"/>
          <circle cx="12" cy="32" r="7" fill="#a9d18e"/>
          <path d="M35,14 A16,16 0 0,1 44,26" stroke="#ccc" stroke-width="1.5" fill="none"/>
          <path d="M26,39 A16,16 0 0,1 16,26" stroke="#ccc" stroke-width="1.5" fill="none"/>
          <path d="M18,10 A16,16 0 0,1 26,5" stroke="#ccc" stroke-width="1.5" fill="none"/>`,
  },
  {
    id: 'venn', label: 'Venn',
    svg: `<ellipse cx="24" cy="22" rx="18" ry="14" fill="#4472c4" opacity=".5" stroke="#4472c4" stroke-width="1"/>
          <ellipse cx="36" cy="22" rx="18" ry="14" fill="#ed7d31" opacity=".5" stroke="#ed7d31" stroke-width="1"/>`,
  },
  {
    id: 'accordion', label: 'Accordion',
    svg: `<rect x="2" y="4" width="46" height="10" rx="2" fill="#4472c4" opacity=".9"/>
          <rect x="2" y="17" width="46" height="10" rx="2" fill="#ed7d31" opacity=".9"/>
          <rect x="2" y="30" width="46" height="10" rx="2" fill="#a9d18e" opacity=".9"/>`,
  },
  {
    id: 'matrix-2x2', label: '2×2 Matrix',
    svg: `<rect x="2" y="2" width="26" height="19" rx="2" fill="#4472c4" opacity=".4" stroke="#4472c4" stroke-width="1"/>
          <rect x="30" y="2" width="26" height="19" rx="2" fill="#ed7d31" opacity=".4" stroke="#ed7d31" stroke-width="1"/>
          <rect x="2" y="23" width="26" height="19" rx="2" fill="#a9d18e" opacity=".4" stroke="#a9d18e" stroke-width="1"/>
          <rect x="30" y="23" width="26" height="19" rx="2" fill="#ffc000" opacity=".4" stroke="#ffc000" stroke-width="1"/>`,
  },
]
</script>

<style scoped>
.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 4px;
}
.template-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 4px;
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 8px;
  background: var(--surface-raised, #fff);
  cursor: pointer;
  font-size: 10px;
  color: var(--fg-muted, #666);
  transition: border-color 0.15s, background 0.15s;
}
.template-btn:hover { background: var(--bg-subtle, #f5f5f5); }
.template-btn.active {
  border-color: var(--accent, #0070f3);
  background: var(--accent-subtle, #e8f0ff);
  color: var(--accent, #0070f3);
}
.thumb { display: block; }
</style>
