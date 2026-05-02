<template>
  <div
    role="toolbar"
    :aria-label="ariaLabel"
    class="avnac-floating-toolbar"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ ariaLabel?: string }>(), { ariaLabel: 'Toolbar' })
</script>

<style scoped>
.avnac-floating-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  background: var(--surface-raised, #fff);
  color: var(--fg-default, #262626);
  border: 1px solid var(--border-default, #e0e0e0);
  border-radius: 999px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  backdrop-filter: blur(8px);
  max-width: min(100vw - 2rem, 900px);
  overflow: visible;
  pointer-events: auto;
}
.avnac-floating-toolbar::-webkit-scrollbar {
  display: none;
}
</style>
