export interface FitTextToBoxInput {
  text: string
  width: number
  height: number
  fontFamily?: string
  fontWeight?: string | number
  lineHeight?: number
  minFontSize?: number
  maxFontSize?: number
  padding?: number
}

export interface FitTextToBoxResult {
  fontSize: number
  lineHeight: number
}

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  return document.createElement('canvas').getContext('2d')
}

function wrappedLineCount(
  ctx: CanvasRenderingContext2D | null,
  text: string,
  maxWidth: number,
  font: string,
): number {
  const normalized = text.trim()
  if (!normalized) return 1
  if (!ctx) {
    return Math.max(1, Math.ceil(normalized.length / Math.max(1, maxWidth / 7)))
  }

  ctx.font = font
  const hardLines = normalized.split(/\r?\n/)
  let lines = 0

  for (const hardLine of hardLines) {
    const words = hardLine.split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines++
      continue
    }

    let current = ''
    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      if (ctx.measureText(next).width <= maxWidth || !current) {
        current = next
      } else {
        lines++
        current = word
      }
    }
    lines++
  }

  return Math.max(1, lines)
}

export function fitTextToBox(input: FitTextToBoxInput): FitTextToBoxResult {
  const padding = input.padding ?? 0
  const width = Math.max(1, input.width - padding * 2)
  const height = Math.max(1, input.height - padding * 2)
  const lineHeight = input.lineHeight ?? 1.12
  const minFontSize = input.minFontSize ?? 6
  const maxFontSize = Math.max(minFontSize, input.maxFontSize ?? 24)
  const family = input.fontFamily ?? 'Inter'
  const weight = input.fontWeight ?? '400'
  const ctx = getMeasureContext()

  let low = minFontSize
  let high = maxFontSize
  let best = minFontSize

  for (let i = 0; i < 8; i++) {
    const mid = (low + high) / 2
    const font = `${weight} ${mid}px ${family}`
    const lines = wrappedLineCount(ctx, input.text, width, font)
    const textHeight = lines * mid * lineHeight

    if (textHeight <= height) {
      best = mid
      low = mid
    } else {
      high = mid
    }
  }

  return {
    fontSize: Math.round(best * 10) / 10,
    lineHeight,
  }
}
