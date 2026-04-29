export type AnimationKind = 'entry' | 'emphasis' | 'exit'
export type AnimationTrigger = 'on-click' | 'with-prev' | 'after-prev'
export type AnimationEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

export interface AvnacAnimationEntry {
  id: string
  kind: AnimationKind
  effect: string
  trigger: AnimationTrigger
  durationMs: number
  delayMs: number
  easing: AnimationEasing
  order: number
}

export interface KeyframeSpec {
  from: Record<string, number>
  to: Record<string, number>
  repeat?: number
  yoyo?: boolean
}

export interface EffectDef {
  kind: AnimationKind
  label: string
  defaultDurationMs: number
  defaultEasing: AnimationEasing
  build(entry: AvnacAnimationEntry): KeyframeSpec
}

export const effectCatalog: Record<string, EffectDef> = {
  // ── Entry ────────────────────────────────────────────────────────────────
  fadeIn: {
    kind: 'entry', label: 'Fade In', defaultDurationMs: 500, defaultEasing: 'easeOut',
    build: () => ({ from: { opacity: 0 }, to: { opacity: 1 } }),
  },
  flyInLeft: {
    kind: 'entry', label: 'Fly In Left', defaultDurationMs: 600, defaultEasing: 'easeOut',
    build: () => ({ from: { opacity: 0, translateX: -120 }, to: { opacity: 1, translateX: 0 } }),
  },
  flyInRight: {
    kind: 'entry', label: 'Fly In Right', defaultDurationMs: 600, defaultEasing: 'easeOut',
    build: () => ({ from: { opacity: 0, translateX: 120 }, to: { opacity: 1, translateX: 0 } }),
  },
  flyInTop: {
    kind: 'entry', label: 'Fly In Top', defaultDurationMs: 600, defaultEasing: 'easeOut',
    build: () => ({ from: { opacity: 0, translateY: -120 }, to: { opacity: 1, translateY: 0 } }),
  },
  flyInBottom: {
    kind: 'entry', label: 'Fly In Bottom', defaultDurationMs: 600, defaultEasing: 'easeOut',
    build: () => ({ from: { opacity: 0, translateY: 120 }, to: { opacity: 1, translateY: 0 } }),
  },
  wipeIn: {
    kind: 'entry', label: 'Wipe In', defaultDurationMs: 500, defaultEasing: 'easeOut',
    build: () => ({ from: { scaleX: 0 }, to: { scaleX: 1 } }),
  },
  zoomIn: {
    kind: 'entry', label: 'Zoom In', defaultDurationMs: 500, defaultEasing: 'easeOut',
    build: () => ({ from: { opacity: 0, scaleX: 0.3, scaleY: 0.3 }, to: { opacity: 1, scaleX: 1, scaleY: 1 } }),
  },
  growIn: {
    kind: 'entry', label: 'Grow In', defaultDurationMs: 500, defaultEasing: 'easeOut',
    build: () => ({ from: { scaleX: 0.1, scaleY: 0.1 }, to: { scaleX: 1, scaleY: 1 } }),
  },
  bounceIn: {
    kind: 'entry', label: 'Bounce In', defaultDurationMs: 800, defaultEasing: 'easeOut',
    build: () => ({ from: { opacity: 0, scaleX: 0.5, scaleY: 0.5 }, to: { opacity: 1, scaleX: 1, scaleY: 1 } }),
  },

  // ── Emphasis ─────────────────────────────────────────────────────────────
  pulse: {
    kind: 'emphasis', label: 'Pulse', defaultDurationMs: 600, defaultEasing: 'easeInOut',
    build: () => ({ from: { scaleX: 1, scaleY: 1 }, to: { scaleX: 1.12, scaleY: 1.12 }, repeat: 1, yoyo: true }),
  },
  spin: {
    kind: 'emphasis', label: 'Spin', defaultDurationMs: 800, defaultEasing: 'linear',
    build: () => ({ from: { angle: 0 }, to: { angle: 360 } }),
  },
  shake: {
    kind: 'emphasis', label: 'Shake', defaultDurationMs: 500, defaultEasing: 'linear',
    build: () => ({ from: { translateX: 0 }, to: { translateX: 8 }, repeat: 4, yoyo: true }),
  },
  grow: {
    kind: 'emphasis', label: 'Grow', defaultDurationMs: 500, defaultEasing: 'easeOut',
    build: () => ({ from: { scaleX: 1, scaleY: 1 }, to: { scaleX: 1.2, scaleY: 1.2 } }),
  },
  shrink: {
    kind: 'emphasis', label: 'Shrink', defaultDurationMs: 500, defaultEasing: 'easeOut',
    build: () => ({ from: { scaleX: 1, scaleY: 1 }, to: { scaleX: 0.8, scaleY: 0.8 } }),
  },

  // ── Exit ─────────────────────────────────────────────────────────────────
  fadeOut: {
    kind: 'exit', label: 'Fade Out', defaultDurationMs: 500, defaultEasing: 'easeIn',
    build: () => ({ from: { opacity: 1 }, to: { opacity: 0 } }),
  },
  flyOutLeft: {
    kind: 'exit', label: 'Fly Out Left', defaultDurationMs: 600, defaultEasing: 'easeIn',
    build: () => ({ from: { opacity: 1, translateX: 0 }, to: { opacity: 0, translateX: -120 } }),
  },
  flyOutRight: {
    kind: 'exit', label: 'Fly Out Right', defaultDurationMs: 600, defaultEasing: 'easeIn',
    build: () => ({ from: { opacity: 1, translateX: 0 }, to: { opacity: 0, translateX: 120 } }),
  },
  flyOutLeft2: {
    kind: 'exit', label: 'Fly Out Left', defaultDurationMs: 600, defaultEasing: 'easeIn',
    build: () => ({ from: { opacity: 1, translateX: 0 }, to: { opacity: 0, translateX: -120 } }),
  },
  wipeOut: {
    kind: 'exit', label: 'Wipe Out', defaultDurationMs: 500, defaultEasing: 'easeIn',
    build: () => ({ from: { scaleX: 1 }, to: { scaleX: 0 } }),
  },
  zoomOut: {
    kind: 'exit', label: 'Zoom Out', defaultDurationMs: 500, defaultEasing: 'easeIn',
    build: () => ({ from: { opacity: 1, scaleX: 1, scaleY: 1 }, to: { opacity: 0, scaleX: 0.3, scaleY: 0.3 } }),
  },
  shrinkOut: {
    kind: 'exit', label: 'Shrink Out', defaultDurationMs: 500, defaultEasing: 'easeIn',
    build: () => ({ from: { scaleX: 1, scaleY: 1 }, to: { scaleX: 0.1, scaleY: 0.1 } }),
  },
}

export const EFFECTS_BY_KIND: Record<AnimationKind, string[]> = {
  entry: ['fadeIn', 'flyInLeft', 'flyInRight', 'flyInTop', 'flyInBottom', 'wipeIn', 'zoomIn', 'growIn', 'bounceIn'],
  emphasis: ['pulse', 'spin', 'shake', 'grow', 'shrink'],
  exit: ['fadeOut', 'flyOutLeft', 'flyOutRight', 'wipeOut', 'zoomOut', 'shrinkOut'],
}

export function defaultAnimationEntry(kind: AnimationKind, order: number): AvnacAnimationEntry {
  const effectKey = EFFECTS_BY_KIND[kind][0]
  const def = effectCatalog[effectKey]
  return {
    id: crypto.randomUUID(),
    kind,
    effect: effectKey,
    trigger: kind === 'entry' ? 'on-click' : 'after-prev',
    durationMs: def?.defaultDurationMs ?? 500,
    delayMs: 0,
    easing: def?.defaultEasing ?? 'easeOut',
    order,
  }
}
