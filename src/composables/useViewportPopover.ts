import { ref, onBeforeUnmount } from 'vue'

export interface ViewportPopoverPlacement {
  openUpward: boolean
  shiftX: number
}

export function useViewportPopover(estimatedPanelHeight = 300) {
  const openUpward = ref(false)
  const shiftX = ref(0)

  function update(triggerEl: HTMLElement | null, panelEl: HTMLElement | null) {
    if (!triggerEl) return
    const triggerRect = triggerEl.getBoundingClientRect()
    const panelW = panelEl?.offsetWidth ?? 200
    const vh = window.innerHeight
    const vw = window.innerWidth

    const spaceBelow = vh - triggerRect.bottom
    const spaceAbove = triggerRect.top
    openUpward.value = spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow

    const center = triggerRect.left + triggerRect.width / 2
    const halfPanel = panelW / 2
    const margin = 8
    const leftEdge = center - halfPanel
    const rightEdge = center + halfPanel
    if (leftEdge < margin) {
      shiftX.value = margin - leftEdge
    } else if (rightEdge > vw - margin) {
      shiftX.value = vw - margin - rightEdge
    } else {
      shiftX.value = 0
    }
  }

  return { openUpward, shiftX, update }
}

export function useClickOutside(
  getRefs: () => Array<HTMLElement | null>,
  onOutside: () => void,
) {
  function handler(e: MouseEvent) {
    const els = getRefs()
    const target = e.target as Node
    if (els.some((el) => el?.contains(target))) return
    onOutside()
  }

  function attach() {
    document.addEventListener('mousedown', handler)
  }
  function detach() {
    document.removeEventListener('mousedown', handler)
  }

  onBeforeUnmount(detach)
  return { attach, detach }
}
