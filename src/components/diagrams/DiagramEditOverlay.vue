<template>
  <!-- Port handles overlay — rendered over the Fabric canvas in diagram edit mode -->
  <div
    v-if="store.diagramEditMode && store.editingData"
    class="diagram-overlay"
    :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
  >
    <template v-for="node in store.editingData.nodes" :key="node.id">
      <div
        v-for="port in PORTS"
        :key="port"
        class="port-handle"
        :style="portStyle(node, port)"
        :title="port + ' port'"
        @mousedown.stop="onPortDown(node.id, port, $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useDiagramsStore } from '#/stores/diagrams'
import type { DiagramNode } from '#/lib/avnac-diagram'

const props = defineProps<{
  canvasWidth: number
  canvasHeight: number
  artboardLeft: number  // canvas viewport offset for coordinate mapping
  artboardTop: number
  zoom: number         // 0..1 scale factor
}>()

const emit = defineEmits<{
  'connect-ports': [fromNodeId: string, fromPort: string, toNodeId: string, toPort: string]
}>()

const store = useDiagramsStore()

const PORTS = ['top', 'right', 'bottom', 'left'] as const

function portStyle(node: DiagramNode, port: string) {
  const HANDLE = 10
  const z = props.zoom
  const x = (node.x + (port === 'right' ? node.w : port === 'left' ? 0 : node.w / 2)) * z + props.artboardLeft
  const y = (node.y + (port === 'bottom' ? node.h : port === 'top' ? 0 : node.h / 2)) * z + props.artboardTop
  return {
    left: (x - HANDLE / 2) + 'px',
    top: (y - HANDLE / 2) + 'px',
    width: HANDLE + 'px',
    height: HANDLE + 'px',
  }
}

function onPortDown(nodeId: string, port: string, _evt: MouseEvent) {
  // Simplified: just emit a placeholder — full drag implementation done in canvas layer
  emit('connect-ports', nodeId, port, '', '')
}
</script>

<style scoped>
.diagram-overlay {
  position: absolute;
  top: 0; left: 0;
  pointer-events: none;
}
.port-handle {
  position: absolute;
  border-radius: 50%;
  background: var(--accent, #0070f3);
  border: 2px solid #fff;
  cursor: crosshair;
  pointer-events: all;
  opacity: 0.8;
  transition: opacity 0.1s, transform 0.1s;
}
.port-handle:hover {
  opacity: 1;
  transform: scale(1.4);
}
</style>
