<template>
  <div class="anim-panel">
    <div class="anim-panel__header">
      <span class="anim-panel__title">Animations</span>
      <button class="anim-panel__close" title="Close" @click="emit('close')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!canvasStore.hasObjectSelected" class="anim-panel__empty">
      Select an object to add animations.
    </div>

    <template v-else>
      <!-- Preview button -->
      <div class="anim-panel__preview-row">
        <button class="anim-panel__preview-btn" title="Preview animations" @click="onPreview">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Preview
        </button>
      </div>

      <!-- Grouped entry list -->
      <div v-for="kind in KINDS" :key="kind" class="anim-panel__group">
        <div class="anim-panel__group-header">
          <span>{{ KIND_LABELS[kind] }}</span>
          <button class="anim-panel__add-btn" :title="`Add ${KIND_LABELS[kind]} effect`" @click="addEntry(kind)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <div
          v-for="entry in entriesByKind(kind)"
          :key="entry.id"
          class="anim-panel__entry"
          :class="{ selected: selectedEntryId === entry.id }"
          @click="selectedEntryId = entry.id"
        >
          <div class="anim-panel__entry-row">
            <span class="anim-panel__entry-label">{{ effectLabel(entry.effect) }}</span>
            <span class="anim-panel__trigger-badge">{{ TRIGGER_LABELS[entry.trigger] }}</span>
            <span class="anim-panel__duration">{{ entry.durationMs }}ms</span>
            <button class="anim-panel__delete-btn" title="Remove" @click.stop="removeEntry(entry.id)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Inline editor for selected entry -->
          <div v-if="selectedEntryId === entry.id" class="anim-panel__inline-editor" @click.stop>
            <label class="anim-panel__field">
              <span>Effect</span>
              <select :value="entry.effect" @change="updateEntry(entry.id, 'effect', ($event.target as HTMLSelectElement).value)">
                <option v-for="key in EFFECTS_BY_KIND[kind]" :key="key" :value="key">
                  {{ effectCatalog[key]?.label ?? key }}
                </option>
              </select>
            </label>

            <label class="anim-panel__field">
              <span>Trigger</span>
              <select :value="entry.trigger" @change="updateEntry(entry.id, 'trigger', ($event.target as HTMLSelectElement).value)">
                <option value="on-click">On click</option>
                <option value="with-prev">With previous</option>
                <option value="after-prev">After previous</option>
              </select>
            </label>

            <label class="anim-panel__field">
              <span>Duration (ms)</span>
              <input
                type="range" min="100" max="5000" step="50"
                :value="entry.durationMs"
                @input="updateEntry(entry.id, 'durationMs', Number(($event.target as HTMLInputElement).value))"
              />
              <span class="anim-panel__range-val">{{ entry.durationMs }}</span>
            </label>

            <label class="anim-panel__field">
              <span>Delay (ms)</span>
              <input
                type="range" min="0" max="10000" step="100"
                :value="entry.delayMs"
                @input="updateEntry(entry.id, 'delayMs', Number(($event.target as HTMLInputElement).value))"
              />
              <span class="anim-panel__range-val">{{ entry.delayMs }}</span>
            </label>

            <label class="anim-panel__field">
              <span>Easing</span>
              <select :value="entry.easing" @change="updateEntry(entry.id, 'easing', ($event.target as HTMLSelectElement).value)">
                <option value="linear">Linear</option>
                <option value="easeIn">Ease In</option>
                <option value="easeOut">Ease Out</option>
                <option value="easeInOut">Ease In Out</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '#/stores/canvas'
import { effectCatalog, EFFECTS_BY_KIND, defaultAnimationEntry } from '#/lib/avnac-animation'
import type { AnimationKind, AnimationTrigger, AnimationEasing, AvnacAnimationEntry } from '#/lib/avnac-animation'

const emit = defineEmits<{ close: [] }>()

const canvasStore = useCanvasStore()

const KINDS: AnimationKind[] = ['entry', 'emphasis', 'exit']
const KIND_LABELS: Record<AnimationKind, string> = { entry: 'Entry', emphasis: 'Emphasis', exit: 'Exit' }
const TRIGGER_LABELS: Record<AnimationTrigger, string> = {
  'on-click': 'Click',
  'with-prev': 'With',
  'after-prev': 'After',
}

const selectedEntryId = ref<string | null>(null)

const entries = computed<AvnacAnimationEntry[]>(() => canvasStore.animationToolbarModel?.entries ?? [])

function entriesByKind(kind: AnimationKind) {
  return entries.value.filter((e) => e.kind === kind).sort((a, b) => a.order - b.order)
}

function effectLabel(key: string): string {
  return effectCatalog[key]?.label ?? key
}

function writeBack(updated: AvnacAnimationEntry[]) {
  if (canvasStore.animationToolbarModel) {
    canvasStore.animationToolbarModel.entries = updated
  }
}

function addEntry(kind: AnimationKind) {
  const maxOrder = entries.value.reduce((m, e) => Math.max(m, e.order), -1)
  const entry = defaultAnimationEntry(kind, maxOrder + 1)
  writeBack([...entries.value, entry])
  selectedEntryId.value = entry.id
}

function removeEntry(id: string) {
  if (selectedEntryId.value === id) selectedEntryId.value = null
  writeBack(entries.value.filter((e) => e.id !== id))
}

function updateEntry(id: string, field: keyof AvnacAnimationEntry, value: unknown) {
  writeBack(entries.value.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
}

function onPreview() {
  // Preview is wired in the runtime module when available — emit event for parent to handle
  emit('close')
}
</script>

<style scoped>
.anim-panel {
  width: 260px;
  background: var(--surface-raised, #fff);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  font-size: 12px;
  color: var(--fg-default, #262626);
  overflow: hidden;
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
.anim-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--border-default, #e0e0e0);
  flex-shrink: 0;
}
.anim-panel__title { font-weight: 600; font-size: 13px; }
.anim-panel__close {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 4px; border: none;
  background: transparent; cursor: pointer; color: var(--fg-muted, #71717a);
}
.anim-panel__close:hover { background: var(--bg-subtle, #f5f5f5); }
.anim-panel__empty {
  padding: 24px 16px; text-align: center; color: var(--fg-muted, #71717a);
}
.anim-panel__preview-row {
  padding: 8px 12px 4px;
  flex-shrink: 0;
}
.anim-panel__preview-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-default, #e0e0e0);
  background: var(--bg-subtle, #f5f5f5); cursor: pointer; font-size: 11px; font-weight: 500;
  color: var(--fg-default, #262626);
}
.anim-panel__preview-btn:hover { background: var(--accent-subtle, #eef2ff); }
.anim-panel__group {
  border-top: 1px solid var(--border-default, #e0e0e0);
  overflow-y: auto;
}
.anim-panel__group-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px 4px; font-weight: 600; font-size: 11px;
  color: var(--fg-muted, #71717a); text-transform: uppercase; letter-spacing: 0.05em;
}
.anim-panel__add-btn {
  display: flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 4px; border: none;
  background: transparent; cursor: pointer; color: var(--fg-muted, #71717a);
}
.anim-panel__add-btn:hover { background: var(--bg-subtle, #f5f5f5); color: var(--fg-default, #262626); }
.anim-panel__entry {
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 6px;
  margin: 2px 6px;
  transition: background 0.1s;
}
.anim-panel__entry:hover { background: var(--bg-subtle, #f5f5f5); }
.anim-panel__entry.selected { background: var(--accent-subtle, #eef2ff); }
.anim-panel__entry-row {
  display: flex; align-items: center; gap: 6px;
}
.anim-panel__entry-label { flex: 1; font-weight: 500; font-size: 12px; }
.anim-panel__trigger-badge {
  font-size: 10px; padding: 1px 5px; border-radius: 4px;
  background: var(--bg-subtle, #f0f0f0); color: var(--fg-muted, #71717a);
}
.anim-panel__duration { font-size: 10px; color: var(--fg-muted, #71717a); min-width: 34px; text-align: right; }
.anim-panel__delete-btn {
  display: flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 4px; border: none;
  background: transparent; cursor: pointer; color: var(--fg-muted, #71717a); opacity: 0;
}
.anim-panel__entry:hover .anim-panel__delete-btn,
.anim-panel__entry.selected .anim-panel__delete-btn { opacity: 1; }
.anim-panel__delete-btn:hover { background: #fee2e2; color: #dc2626; }
.anim-panel__inline-editor {
  padding: 8px 0 4px;
  display: flex; flex-direction: column; gap: 7px;
}
.anim-panel__field {
  display: grid; grid-template-columns: 80px 1fr auto; align-items: center; gap: 6px;
  font-size: 11px;
}
.anim-panel__field span:first-child { color: var(--fg-muted, #71717a); }
.anim-panel__field select,
.anim-panel__field input[type="range"] {
  font-size: 11px; border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 4px; padding: 2px 4px; background: var(--surface, #fff);
  color: var(--fg-default, #262626); width: 100%;
}
.anim-panel__field input[type="range"] { padding: 0; border: none; cursor: pointer; }
.anim-panel__range-val { font-size: 10px; color: var(--fg-muted, #71717a); min-width: 36px; text-align: right; }
</style>
