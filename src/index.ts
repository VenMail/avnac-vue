export { default as CanvasEditor } from './components/canvas/CanvasEditor.vue'
export { createAvnacSmartObjectsPlugin } from './plugins/smart-objects'
export type { AvnacDocumentV1 } from './lib/avnac-document'
export type { BgValue } from './lib/bg-value'
export type {
  AvnacSmartObjectData,
  AvnacSmartObjectKind,
  AvnacSmartObjectRole,
} from './plugins/smart-objects'
export type {
  AvnacEditorContext,
  AvnacEditorPlugin,
  AvnacCommandRegistry,
} from './lib/avnac-plugin'
