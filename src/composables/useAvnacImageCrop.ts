import { ref } from 'vue'
import type { Canvas } from 'fabric'

export type ImageCropRect = { x: number; y: number; w: number; h: number }
export type ImageCropApplyPayload = { cropX: number; cropY: number; width: number; height: number }

/**
 * Self-contained composable for the image crop workflow.
 * Wire it up in your host component:
 *
 *   const { cropModalOpen, cropImageSrc, cropInitial, onCropImage, onApplyImageCrop }
 *     = useAvnacImageCrop(() => fabricCanvas.value)
 *
 * Then pass onCropImage to your toolbar's @crop-image handler and render
 * <ImageCropModal :open="cropModalOpen" :image-src="cropImageSrc"
 *   :initial-crop="cropInitial" @cancel="cropModalOpen=false" @apply="onApplyImageCrop" />
 */
export function useAvnacImageCrop(getCanvas: () => Canvas | null) {
  const cropModalOpen = ref(false)
  const cropImageSrc = ref('')
  const cropInitial = ref<ImageCropRect>({ x: 0, y: 0, w: 1, h: 1 })

  async function onCropImage() {
    const canvas = getCanvas()
    if (!canvas) return
    const active = canvas.getActiveObject() as any
    if (!active?.getSrc) return
    const { getFabricImageSourceCrop } = await import('#/lib/avnac-fabric-image-crop')
    const crop = getFabricImageSourceCrop(active)
    cropImageSrc.value = active.getSrc()
    cropInitial.value = { x: crop.cropX, y: crop.cropY, w: crop.width, h: crop.height }
    cropModalOpen.value = true
  }

  async function onApplyImageCrop(rect: ImageCropApplyPayload) {
    const canvas = getCanvas()
    const active = canvas?.getActiveObject() as any
    if (!canvas || !active) return
    const [{ applyFabricImageSourceCrop }, mod] = await Promise.all([
      import('#/lib/avnac-fabric-image-crop'),
      import('fabric'),
    ])
    if (!(active instanceof mod.FabricImage)) return
    const radius = (active as any).avnacCornerRadius ?? 0
    applyFabricImageSourceCrop(active, rect, mod, radius)
    active.set?.('dirty', true)
    active.setCoords?.()
    canvas.requestRenderAll()
    canvas.fire?.('object:modified', { target: active })
    cropModalOpen.value = false
  }

  return {
    cropModalOpen,
    cropImageSrc,
    cropInitial,
    onCropImage,
    onApplyImageCrop,
  }
}
