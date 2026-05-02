import type { Canvas, IText } from 'fabric'
import type { TextFormatToolbarValues } from '#/stores/canvas'
import { applyBgValueToFill } from '#/lib/avnac-fill-paint'
import { ensureGoogleFontFamilyReady } from '#/lib/load-google-font'

function isTextObject(mod: typeof import('fabric'), obj: unknown): obj is IText {
  return !!obj && (obj instanceof mod.IText || obj instanceof mod.Textbox)
}

function hasTextRange(obj: IText): boolean {
  return !!obj.isEditing && typeof obj.selectionStart === 'number' && typeof obj.selectionEnd === 'number' && obj.selectionStart !== obj.selectionEnd
}

export async function applyTextFormatChange(
  mod: typeof import('fabric'),
  canvas: Canvas,
  active: unknown,
  partial: Partial<TextFormatToolbarValues>,
) {
  if (!isTextObject(mod, active)) return false

  const objectProps: Record<string, unknown> = {}
  const selectionProps: Record<string, unknown> = {}

  if (partial.fontFamily !== undefined) {
    await ensureGoogleFontFamilyReady(partial.fontFamily)
    mod.cache.clearFontCache(partial.fontFamily)
    objectProps.fontFamily = partial.fontFamily
    selectionProps.fontFamily = partial.fontFamily
  }
  if (partial.fontSize !== undefined) {
    objectProps.fontSize = partial.fontSize
    selectionProps.fontSize = partial.fontSize
  }
  if (partial.bold !== undefined) {
    const fontWeight = partial.bold ? 'bold' : 'normal'
    objectProps.fontWeight = fontWeight
    selectionProps.fontWeight = fontWeight
  }
  if (partial.italic !== undefined) {
    const fontStyle = partial.italic ? 'italic' : 'normal'
    objectProps.fontStyle = fontStyle
    selectionProps.fontStyle = fontStyle
  }
  if (partial.underline !== undefined) {
    objectProps.underline = partial.underline
    selectionProps.underline = partial.underline
  }
  if (partial.textAlign !== undefined) objectProps.textAlign = partial.textAlign
  if (partial.lineHeight !== undefined) objectProps.lineHeight = partial.lineHeight

  if (partial.fillStyle !== undefined) {
    if (partial.fillStyle.type === 'solid') {
      objectProps.fill = partial.fillStyle.color
      selectionProps.fill = partial.fillStyle.color
    } else {
      applyBgValueToFill(mod, active, partial.fillStyle)
    }
  }

  if (hasTextRange(active) && Object.keys(selectionProps).length > 0) {
    active.setSelectionStyles(selectionProps)
  } else if (Object.keys(objectProps).length > 0) {
    active.set(objectProps)
  }

  active.initDimensions()
  active.setCoords()
  active.dirty = true
  canvas.requestRenderAll()
  return true
}
