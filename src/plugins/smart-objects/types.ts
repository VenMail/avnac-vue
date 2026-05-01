import type { AvnacDiagramData } from '#/lib/avnac-diagram'
import type { AvnacInfographicData } from '#/lib/avnac-infographic'

export type AvnacSmartObjectKind = 'infographic' | 'flowchart' | 'organogram'

export type AvnacSmartObjectRole =
  | 'shape'
  | 'label'
  | 'sublabel'
  | 'value'
  | 'connector'
  | 'decoration'
  | 'frame'
  | 'arrow-head'

export interface AvnacSmartObjectBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface AvnacSmartObjectData {
  id: string
  kind: AvnacSmartObjectKind
  template: string
  version: 1
  bounds: AvnacSmartObjectBounds
  source: AvnacInfographicData | AvnacDiagramData
}

export interface SmartObjectInsertOptions {
  left?: number
  top?: number
}

export interface InsertInfographicPayload extends SmartObjectInsertOptions {
  data: AvnacInfographicData
}

export interface InsertDiagramPayload extends SmartObjectInsertOptions {
  data: AvnacDiagramData
}

export interface ReplaceSmartObjectPayload {
  id: string
  data: AvnacInfographicData | AvnacDiagramData
}

export interface SelectedSmartObjectInfo {
  id: string
  kind: AvnacSmartObjectKind
  data: AvnacSmartObjectData
}

export interface SmartObjectInsertResult {
  id: string
  objects: import('fabric').FabricObject[]
}
