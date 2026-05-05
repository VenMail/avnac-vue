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

// Image crop
export { default as ImageCropModal } from './components/modals/ImageCropModal.vue'
export type { ImageCropModalApplyPayload } from './components/modals/ImageCropModal.vue'
export { useAvnacImageCrop } from './composables/useAvnacImageCrop'
export type { ImageCropRect, ImageCropApplyPayload } from './composables/useAvnacImageCrop'
export { applyFabricImageSourceCrop, getFabricImageSourceCrop } from './lib/avnac-fabric-image-crop'
export type { FabricImageSourceCrop } from './lib/avnac-fabric-image-crop'
