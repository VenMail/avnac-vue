import type { FabricImage } from 'fabric'

export type ImageMaskKind = 'none' | 'rect' | 'rounded' | 'circle' | 'ellipse'

export function applyFabricImageMask(
  img: FabricImage,
  mod: typeof import('fabric'),
  kind: ImageMaskKind,
) {
  const w = img.width || 0
  const h = img.height || 0
  if (w <= 0 || h <= 0) return

  if (kind === 'none' || kind === 'rect') {
    img.set({ clipPath: undefined, avnacImageMask: kind } as Partial<FabricImage> & { avnacImageMask?: ImageMaskKind })
    img.set('dirty', true)
    img.setCoords()
    return
  }

  const common = {
    left: 0,
    top: 0,
    originX: 'center' as const,
    originY: 'center' as const,
    absolutePositioned: false,
  }

  const clip = kind === 'circle' || kind === 'ellipse'
    ? new mod.Ellipse({
      ...common,
      rx: kind === 'circle' ? Math.min(w, h) / 2 : w / 2,
      ry: kind === 'circle' ? Math.min(w, h) / 2 : h / 2,
    })
    : new mod.Rect({
      ...common,
      width: w,
      height: h,
      rx: Math.min(w, h) * 0.12,
      ry: Math.min(w, h) * 0.12,
    })

  img.set({
    clipPath: clip,
    avnacImageMask: kind,
  } as Partial<FabricImage> & { avnacImageMask?: ImageMaskKind })
  img.set('dirty', true)
  img.setCoords()
}
