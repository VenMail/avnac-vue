// Animation runtime for avnac canvas objects.
// Uses motion.dev animate() for per-property tweening with proper easing.
// Honors AnimationTrigger semantics: on-click pauses at trigger point, after-prev sequences.
import type { Canvas, FabricObject } from 'fabric'
import type { AvnacAnimationEntry } from './avnac-animation'
import { effectCatalog } from './avnac-animation'
import { animate, type AnimationPlaybackControls } from 'motion'

export interface TimelineHandle {
  play(): void
  pause(): void
  advance(): void
  seek(ms: number): void
  dispose(): void
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
type Snapshot = Record<string, number>

function snapshotObj(obj: FabricObject): Snapshot {
  return {
    opacity: (obj.opacity as number) ?? 1,
    scaleX:  (obj.scaleX  as number) ?? 1,
    scaleY:  (obj.scaleY  as number) ?? 1,
    angle:   (obj.angle   as number) ?? 0,
    left:    (obj.left    as number) ?? 0,
    top:     (obj.top     as number) ?? 0,
  }
}

function restoreSnapshot(obj: FabricObject, snap: Snapshot) {
  for (const [k, v] of Object.entries(snap)) {
    ;(obj as any)[k] = v
  }
  obj.setCoords?.()
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
  const def = effectCatalog[entry.effect]
  const kf = def?.build(entry) ?? { from: {}, to: {} }
  const controls: AnimationPlaybackControls[] = []

  const toEntries = Object.entries(kf.to)
  if (!toEntries.length) return { controls, done: Promise.resolve() }

  // Apply initial (from) props immediately — they take effect before delay fires.
  for (const [prop, fromVal] of Object.entries(kf.from)) {
    ;(obj as any)[prop] = fromVal
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
        (kf.from[prop] as number) ?? ((obj as any)[prop] as number) ?? toVal as number

      const ctrl = animate(fromVal, toVal as number, {
        duration: durationS,
        delay: delayS,
        ease,
        onUpdate: (val: number) => {
          ;(obj as any)[prop] = val
          queueRender()
        },
        onComplete: () => {
          ;(obj as any)[prop] = toVal
          pending--
          if (pending === 0) {
            obj.setCoords?.()
            canvas.requestRenderAll()
            resolve()
          }
        },
      } as any)

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

  // After all animations complete, restore the object to its original look.
  Promise.all(allDone).then(() => {
    restoreSnapshot(obj, snap)
    canvas.requestRenderAll()
  })
}

// ── Slide timeline ────────────────────────────────────────────────────────────
export function buildSlideTimeline(canvas: Canvas): TimelineHandle {
  const objects = canvas.getObjects()

  interface AnimState {
    obj: FabricObject
    entry: AvnacAnimationEntry
  }

  const allStates: AnimState[] = []
  for (const obj of objects) {
    const entries: AvnacAnimationEntry[] = (obj as any).avnacAnimations ?? []
    for (const entry of entries) {
      allStates.push({ obj, entry })
    }
  }
  allStates.sort((a, b) => a.entry.order - b.entry.order)

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
      // Motion doesn't support arbitrary seek on running animations.
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

export function disposeTimeline(handle: TimelineHandle): void {
  handle.dispose()
}
