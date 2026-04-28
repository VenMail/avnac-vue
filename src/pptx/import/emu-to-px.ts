const EMU_PER_INCH = 914400

export function emuToInches(emu: number): number {
  return emu / EMU_PER_INCH
}

export function emuToSlidePercent(emu: number, slideEmu: number): number {
  return emu / slideEmu
}

export function emuToPx(emu: number, artboardPx: number, slideEmu: number): number {
  return (emu / slideEmu) * artboardPx
}
