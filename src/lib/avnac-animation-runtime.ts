// Animation runtime for avnac canvas objects.
// Uses a Fabric-specific requestAnimationFrame tween so canvas state always restores cleanly.
// Honors AnimationTrigger semantics: on-click pauses at trigger point, after-prev sequences.
import type { Canvas, FabricObject } from 'fabric'
import type { AvnacAnimationEntry } from './avnac-animation'
import { effectCatalog } from './avnac-animation'

interface AnimationPlaybackControls {
  play(): void
  pause(): void
  cancel(): void
}

export interface TimelineHandle {
  play(): void
  pause(): void
  advance(): void
  seek(ms: number): void
  dispose(): void
}

interface AnimState {
  obj: FabricObject
  entry: AvnacAnimationEntry
}

// ── Easing map ────────────────────────────────────────────────────────────────
function motionEase(e: string): string {
  switch (e) {
    case 'linear':    return 'linear'
    case 'easeIn':    return 'ease-in'
    case 'easeOut':   return 'ease-out'
    case 'easeInOut': return 'ease-in-out'
    default:          return 'ease-out'
  }
}

// ── Snapshot/restore helpers ─────────────────────────────────────────────────
interface Snapshot {
  opacity: number
  scaleX: number
  scaleY: number
  angle: number
  left: number
  top: number
  text?: string
}

function snapshotObj(obj: FabricObject): Snapshot {
  return {
    opacity: (obj.opacity as number) ?? 1,
    scaleX:  (obj.scaleX  as number) ?? 1,
    scaleY:  (obj.scaleY  as number) ?? 1,
    angle:   (obj.angle   as number) ?? 0,
    left:    (obj.left    as number) ?? 0,
    top:     (obj.top     as number) ?? 0,
    text:    typeof (obj as { text?: unknown }).text === 'string' ? (obj as unknown as { text: string }).text : undefined,
  }
}

function restoreSnapshot(obj: FabricObject, snap: Snapshot) {
  for (const [k, v] of Object.entries(snap)) {
    if (v === undefined) continue
    ;(obj as any)[k] = v
  }
  obj.setCoords?.()
}

function easeProgress(ease: string, t: number): number {
  const p = Math.max(0, Math.min(1, t))
  switch (ease) {
    case 'ease-in':
      return p * p
    case 'ease-out':
      return 1 - (1 - p) * (1 - p)
    case 'ease-in-out':
      return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
    default:
      return p
  }
}

function animateNumber(
  from: number,
  to: number,
  opts: {
    duration: number
    delay: number
    ease: string
    repeat?: number
    yoyo?: boolean
    onUpdate(value: number): void
    onComplete(): void
  },
): AnimationPlaybackControls {
  let raf = 0
  let cancelled = false
  let paused = false
  let startedAt = performance.now() + opts.delay * 1000
  let pausedAt = 0
  const legs = Math.max(1, Math.round((opts.repeat ?? 0) + 1))
  const durationMs = Math.max(1, opts.duration * 1000)

  const tick = (now: number) => {
    if (cancelled) return
    if (paused) {
      raf = requestAnimationFrame(tick)
      return
    }

    const elapsed = now - startedAt
    if (elapsed < 0) {
      raf = requestAnimationFrame(tick)
      return
    }

    const leg = Math.min(legs - 1, Math.floor(elapsed / durationMs))
    const raw = Math.min(1, (elapsed - leg * durationMs) / durationMs)
    const reverse = opts.yoyo === true && leg % 2 === 1
    const eased = easeProgress(opts.ease, reverse ? 1 - raw : raw)
    opts.onUpdate(from + (to - from) * eased)

    if (elapsed >= durationMs * legs) {
      opts.onUpdate(opts.yoyo && legs % 2 === 0 ? from : to)
      opts.onComplete()
      return
    }
    raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)

  return {
    play() {
      if (!paused) return
      paused = false
      startedAt += performance.now() - pausedAt
    },
    pause() {
      if (paused) return
      paused = true
      pausedAt = performance.now()
    },
    cancel() {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
    },
  }
}

function readLogicalProp(obj: FabricObject, prop: string, base: Snapshot): number {
  switch (prop) {
    case 'translateX':
      return (((obj.left as number) ?? base.left) - base.left)
    case 'translateY':
      return (((obj.top as number) ?? base.top) - base.top)
    case 'scaleX':
      return (((obj.scaleX as number) ?? base.scaleX) / Math.max(0.0001, base.scaleX))
    case 'scaleY':
      return (((obj.scaleY as number) ?? base.scaleY) / Math.max(0.0001, base.scaleY))
    case 'angle':
      return (((obj.angle as number) ?? base.angle) - base.angle)
    default:
      return ((obj as any)[prop] as number) ?? 0
  }
}

function applyLogicalProp(obj: FabricObject, prop: string, value: number, base: Snapshot) {
  switch (prop) {
    case 'translateX':
      ;(obj as any).left = base.left + value
      return
    case 'translateY':
      ;(obj as any).top = base.top + value
      return
    case 'scaleX':
      ;(obj as any).scaleX = base.scaleX * value
      return
    case 'scaleY':
      ;(obj as any).scaleY = base.scaleY * value
      return
    case 'angle':
      ;(obj as any).angle = base.angle + value
      return
    default:
      ;(obj as any)[prop] = value
  }
}

function isTextObject(obj: FabricObject): obj is FabricObject & { text: string; set: (key: string, value: unknown) => void } {
  return typeof (obj as { text?: unknown }).text === 'string'
}

function runTextEntry(
  obj: FabricObject,
  entry: AvnacAnimationEntry,
  delayS: number,
  canvas: Canvas,
): { controls: AnimationPlaybackControls[]; done: Promise<void> } | null {
  if (!isTextObject(obj)) return null
  if (entry.effect !== 'textTypewriter' && entry.effect !== 'textWordReveal') return null

  const original = obj.text
  const words = original.split(/(\s+)/)
  const max = entry.effect === 'textWordReveal' ? words.length : original.length
  const controls: AnimationPlaybackControls[] = []

  obj.set('text', '')
  obj.setCoords?.()
  canvas.requestRenderAll()

  const done = new Promise<void>((resolve) => {
    const ctrl = animateNumber(0, max, {
      duration: entry.durationMs / 1000,
      delay: delayS,
      ease: motionEase(entry.easing),
      onUpdate: (value) => {
        const count = Math.max(0, Math.min(max, Math.round(value)))
        obj.set('text', entry.effect === 'textWordReveal' ? words.slice(0, count).join('') : original.slice(0, count))
        obj.setCoords?.()
        canvas.requestRenderAll()
      },
      onComplete: () => {
        obj.set('text', original)
        obj.setCoords?.()
        canvas.requestRenderAll()
        resolve()
      },
    })
    controls.push(ctrl)
  })

  return { controls, done }
}

// ── Animate one entry on one object ──────────────────────────────────────────
// Returns all controls started (one per animated property) and a promise that
// resolves when all properties finish.
function runEntry(
  obj: FabricObject,
  entry: AvnacAnimationEntry,
  delayS: number,
  canvas: Canvas,
): { controls: AnimationPlaybackControls[]; done: Promise<void> } {
  const textRun = runTextEntry(obj, entry, delayS, canvas)
  if (textRun) return textRun

  const def = effectCatalog[entry.effect]
  const kf = def?.build(entry) ?? { from: {}, to: {} }
  const controls: AnimationPlaybackControls[] = []
  const base = snapshotObj(obj)

  const toEntries = Object.entries(kf.to)
  if (!toEntries.length) return { controls, done: Promise.resolve() }

  // Apply initial (from) props immediately — they take effect before delay fires.
  for (const [prop, fromVal] of Object.entries(kf.from)) {
    applyLogicalProp(obj, prop, fromVal, base)
  }
  obj.setCoords?.()
  canvas.requestRenderAll()

  const durationS = entry.durationMs / 1000
  const ease = motionEase(entry.easing)

  // Batch canvas renders with rAF to avoid one call per property per frame.
  let frameQueued = false
  function queueRender() {
    if (frameQueued) return
    frameQueued = true
    requestAnimationFrame(() => {
      frameQueued = false
      obj.setCoords?.()
      canvas.requestRenderAll()
    })
  }

  let pending = toEntries.length
  const done = new Promise<void>((resolve) => {
    for (const [prop, toVal] of toEntries) {
      const fromVal: number =
        (kf.from[prop] as number) ?? readLogicalProp(obj, prop, base) ?? toVal as number

      const ctrl = animateNumber(fromVal, toVal as number, {
        duration: durationS,
        delay: delayS,
        ease,
        repeat: kf.repeat,
        yoyo: kf.yoyo,
        onUpdate: (val: number) => {
          applyLogicalProp(obj, prop, val, base)
          queueRender()
        },
        onComplete: () => {
          applyLogicalProp(obj, prop, toVal as number, base)
          pending--
          if (pending === 0) {
            obj.setCoords?.()
            canvas.requestRenderAll()
            resolve()
          }
        },
      })

      controls.push(ctrl)
    }
  })

  return { controls, done }
}

// ── Preview single object animations ────────────────────────────────────────
export function previewObjectAnimations(canvas: Canvas, obj: FabricObject): void {
  const entries: AvnacAnimationEntry[] = (obj as any).avnacAnimations ?? []
  if (!entries.length) return

  const snap = snapshotObj(obj)
  const sorted = [...entries].sort((a, b) => a.order - b.order)

  let allControls: AnimationPlaybackControls[] = []
  let cursor = 0  // seconds

  const allDone: Promise<void>[] = []

  for (const entry of sorted) {
    const delayS = cursor + entry.delayMs / 1000
    const { controls, done } = runEntry(obj, entry, delayS, canvas)
    allControls = allControls.concat(controls)
    allDone.push(done)
    cursor = delayS + entry.durationMs / 1000
  }

  let restored = false
  const restore = () => {
    if (restored) return
    restored = true
    for (const control of allControls) control.cancel()
    restoreSnapshot(obj, snap)
    canvas.requestRenderAll()
  }

  Promise.all(allDone).then(restore)
  window.setTimeout(restore, Math.max(300, cursor * 1000 + 250))
}

// ── Slide timeline ────────────────────────────────────────────────────────────
function collectAnimationStates(canvas: Canvas): AnimState[] {
  const allStates: AnimState[] = []
  for (const obj of canvas.getObjects()) {
    const entries: AvnacAnimationEntry[] = (obj as any).avnacAnimations ?? []
    for (const entry of entries) {
      allStates.push({ obj, entry })
    }
  }
  allStates.sort((a, b) => a.entry.order - b.entry.order)
  return allStates
}

export function buildSlideTimeline(canvas: Canvas): TimelineHandle {
  const allStates = collectAnimationStates(canvas)

  // Partition into click groups. A new group starts when trigger === 'on-click'
  // AND the current group already has items.
  const clickGroups: AnimState[][] = [[]]
  let groupIdx = 0
  for (const state of allStates) {
    if (state.entry.trigger === 'on-click' && clickGroups[groupIdx].length > 0) {
      groupIdx++
      clickGroups.push([])
    }
    clickGroups[groupIdx].push(state)
  }

  let currentGroup = 0
  let activeControls: AnimationPlaybackControls[] = []

  function cancelActive() {
    for (const c of activeControls) {
      try { c.cancel() } catch { /* already done */ }
    }
    activeControls = []
  }

  function playGroup(idx: number) {
    if (idx >= clickGroups.length) return
    cancelActive()

    const group = clickGroups[idx]
    let cursor = 0      // seconds into the group timeline
    let prevStart = 0  // when the last non-with-prev item started

    for (const { obj, entry } of group) {
      let startS: number
      if (entry.trigger === 'with-prev') {
        startS = prevStart + entry.delayMs / 1000
      } else {
        startS = cursor + entry.delayMs / 1000
        prevStart = startS
        cursor = startS + entry.durationMs / 1000
      }
      const { controls } = runEntry(obj, entry, startS, canvas)
      activeControls = activeControls.concat(controls)
    }
  }

  return {
    play() {
      playGroup(currentGroup)
    },
    pause() {
      for (const c of activeControls) {
        try { c.pause() } catch { /* ignore */ }
      }
    },
    advance() {
      if (currentGroup < clickGroups.length - 1) {
        currentGroup++
        playGroup(currentGroup)
      }
    },
    seek(ms: number) {
      // Cancel and restart with adjusted delays.
      cancelActive()
      const group = clickGroups[currentGroup]
      let cursor = 0
      let prevStart = 0
      for (const { obj, entry } of group) {
        let startS: number
        if (entry.trigger === 'with-prev') {
          startS = prevStart + entry.delayMs / 1000
        } else {
          startS = cursor + entry.delayMs / 1000
          prevStart = startS
          cursor = startS + entry.durationMs / 1000
        }
        const adjustedDelay = Math.max(0, startS - ms / 1000)
        const { controls } = runEntry(obj, entry, adjustedDelay, canvas)
        activeControls = activeControls.concat(controls)
      }
    },
    dispose() {
      cancelActive()
    },
  }
}

export function playSlideAnimations(canvas: Canvas): TimelineHandle {
  const handle = buildSlideTimeline(canvas)
  handle.play()
  return handle
}

export function hasSlideAnimations(canvas: Canvas): boolean {
  return collectAnimationStates(canvas).length > 0
}

export function previewSlideAnimations(canvas: Canvas): TimelineHandle {
  const states = collectAnimationStates(canvas)
  const objects = Array.from(new Set(states.map((state) => state.obj)))
  const snapshots = new Map(objects.map((obj) => [obj, snapshotObj(obj)] as const))
  let activeControls: AnimationPlaybackControls[] = []
  const done: Promise<void>[] = []
  let cursor = 0
  let prevStart = 0

  for (const { obj, entry } of states) {
    let startS: number
    if (entry.trigger === 'with-prev') {
      startS = prevStart + entry.delayMs / 1000
    } else {
      startS = cursor + entry.delayMs / 1000
      prevStart = startS
      cursor = startS + entry.durationMs / 1000
    }
    const run = runEntry(obj, entry, startS, canvas)
    activeControls = activeControls.concat(run.controls)
    done.push(run.done)
  }

  let restored = false
  const restore = () => {
    if (restored) return
    restored = true
    for (const control of activeControls) control.cancel()
    activeControls = []
    for (const [obj, snap] of snapshots) restoreSnapshot(obj, snap)
    canvas.requestRenderAll()
  }

  Promise.all(done).then(restore)
  window.setTimeout(restore, Math.max(300, cursor * 1000 + 500))

  return {
    play() { /* preview starts immediately */ },
    pause() { for (const control of activeControls) control.pause() },
    advance() { /* preview all has no click stops */ },
    seek() { /* seek is intentionally unsupported for one-shot preview */ },
    dispose: restore,
  }
}

export function disposeTimeline(handle: TimelineHandle): void {
  handle.dispose()
}
