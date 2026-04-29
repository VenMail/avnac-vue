// Animation runtime for avnac canvas objects.
// Uses requestAnimationFrame with per-frame Fabric prop mutation.
// Honors AnimationTrigger semantics: on-click pauses at trigger point, after-prev sequences.
import type { Canvas, FabricObject } from 'fabric'
import type { AvnacAnimationEntry } from './avnac-animation'
import { effectCatalog } from './avnac-animation'

export interface TimelineHandle {
  play(): void
  pause(): void
  advance(): void
  seek(ms: number): void
  dispose(): void
}

// ── Easing functions ─────────────────────────────────────────────────────────
const easings = {
  linear:     (t: number) => t,
  easeIn:     (t: number) => t * t,
  easeOut:    (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut:  (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// ── Single object animation ──────────────────────────────────────────────────
interface ObjectAnimState {
  obj: FabricObject
  entry: AvnacAnimationEntry
  startProps: Record<string, number>
  endProps: Record<string, number>
  startTime: number
  done: boolean
}

function runObjectAnim(
  state: ObjectAnimState,
  now: number,
  canvas: Canvas,
): boolean {
  const { obj, entry } = state
  const def = effectCatalog[entry.effect]
  if (!def) { state.done = true; return true }

  const elapsed = now - state.startTime - entry.delayMs
  if (elapsed < 0) return false

  const progress = Math.min(1, elapsed / entry.durationMs)
  const easeFn = easings[entry.easing] ?? easings.easeOut
  const t = easeFn(progress)

  for (const [prop, endVal] of Object.entries(state.endProps)) {
    const startVal = state.startProps[prop] ?? endVal
    ;(obj as any)[prop] = lerp(startVal, endVal, t)
  }
  obj.setCoords?.()
  canvas.requestRenderAll()

  if (progress >= 1) {
    state.done = true
    return true
  }
  return false
}

// ── Snapshot/restore helpers ─────────────────────────────────────────────────
type Snapshot = Record<string, number>

function snapshotObj(obj: FabricObject): Snapshot {
  return {
    opacity: (obj.opacity as number) ?? 1,
    scaleX: (obj.scaleX as number) ?? 1,
    scaleY: (obj.scaleY as number) ?? 1,
    angle: (obj.angle as number) ?? 0,
    left: (obj.left as number) ?? 0,
    top: (obj.top as number) ?? 0,
  }
}

function restoreSnapshot(obj: FabricObject, snap: Snapshot) {
  for (const [k, v] of Object.entries(snap)) {
    ;(obj as any)[k] = v
  }
  obj.setCoords?.()
}

// ── Preview single object animations ────────────────────────────────────────
export function previewObjectAnimations(canvas: Canvas, obj: FabricObject): void {
  const entries: AvnacAnimationEntry[] = (obj as any).avnacAnimations ?? []
  if (!entries.length) return

  const snap = snapshotObj(obj)
  const sorted = [...entries].sort((a, b) => a.order - b.order)
  const states: ObjectAnimState[] = sorted.map((entry) => {
    const def = effectCatalog[entry.effect]
    const kf = def?.build(entry) ?? { from: {}, to: {} }
    return {
      obj,
      entry,
      startProps: kf.from,
      endProps: kf.to,
      startTime: 0,
      done: false,
    }
  })

  let started = false
  const tick = (now: number) => {
    if (!started) {
      started = true
      let offset = 0
      for (const state of states) {
        state.startTime = now + offset
        offset += state.entry.durationMs + state.entry.delayMs
      }
    }
    let anyRunning = false
    for (const state of states) {
      if (!state.done) {
        runObjectAnim(state, now, canvas)
        if (!state.done) anyRunning = true
      }
    }
    if (anyRunning) {
      requestAnimationFrame(tick)
    } else {
      // Restore object to its original appearance after preview
      restoreSnapshot(obj, snap)
      canvas.requestRenderAll()
    }
  }
  requestAnimationFrame(tick)
}

// ── Slide timeline ────────────────────────────────────────────────────────────
export function buildSlideTimeline(canvas: Canvas): TimelineHandle {
  const objects = canvas.getObjects()
  const allStates: ObjectAnimState[] = []

  // Collect all animation entries across all objects
  for (const obj of objects) {
    const entries: AvnacAnimationEntry[] = (obj as any).avnacAnimations ?? []
    for (const entry of entries) {
      const def = effectCatalog[entry.effect]
      const kf = def?.build(entry) ?? { from: {}, to: {} }
      allStates.push({
        obj,
        entry,
        startProps: kf.from,
        endProps: kf.to,
        startTime: 0,
        done: false,
      })
    }
  }

  // Sort by order and assign start times respecting trigger semantics
  allStates.sort((a, b) => a.entry.order - b.entry.order)

  let paused = false
  let raf = 0
  let playStartWallTime = 0
  let playheadMs = 0
  // Groups of states separated by on-click triggers
  let clickGroupIndex = 0
  const clickGroups: ObjectAnimState[][] = [[]]

  // Partition into click groups
  for (const state of allStates) {
    if (state.entry.trigger === 'on-click' && clickGroups[clickGroupIndex].length > 0) {
      clickGroupIndex++
      clickGroups.push([])
    }
    clickGroups[clickGroupIndex].push(state)
  }
  clickGroupIndex = 0

  function computeStartTimes(group: ObjectAnimState[], baseMs: number) {
    let cursor = baseMs
    let prevEnd = baseMs
    for (const state of group) {
      if (state.entry.trigger === 'with-prev') {
        state.startTime = prevEnd - (allStates.find(s => s !== state) ? state.entry.delayMs : 0)
      } else {
        state.startTime = cursor + state.entry.delayMs
        cursor = state.startTime + state.entry.durationMs
        prevEnd = cursor
      }
    }
  }

  function runGroup(groupIdx: number) {
    if (groupIdx >= clickGroups.length) return
    const group = clickGroups[groupIdx]
    computeStartTimes(group, 0)
    paused = false
    playStartWallTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - playStartWallTime + playheadMs
      let anyRunning = false
      for (const state of group) {
        if (!state.done) {
          runObjectAnim(state, elapsed, canvas)
          if (!state.done) anyRunning = true
        }
      }
      if (anyRunning && !paused) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
  }

  return {
    play() { runGroup(clickGroupIndex) },
    pause() {
      paused = true
      cancelAnimationFrame(raf)
    },
    advance() {
      // Advance to next click group
      if (clickGroupIndex < clickGroups.length - 1) {
        clickGroupIndex++
        runGroup(clickGroupIndex)
      }
    },
    seek(ms: number) {
      playheadMs = ms
    },
    dispose() {
      cancelAnimationFrame(raf)
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
