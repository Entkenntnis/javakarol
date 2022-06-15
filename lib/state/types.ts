import { ClassFile } from '../java/compiler'

export type Heading = 'north' | 'east' | 'south' | 'west'

export interface World {
  dimX: number
  dimY: number
  height: number
  karol: {
    x: number
    y: number
    dir: Heading
  }
  bricks: number[][]
  marks: boolean[][]
  blocks: boolean[][]
}

export interface Message {
  text: string
  count: number
  ts: number
}

export interface Ui {
  messages: Message[]
  gutter: number
  gutterReturns: number[]
  state: 'ready' | 'loading' | 'running' | 'error' | 'stopping'
  needsTextRefresh: boolean
  errorMessages: string[]
  modal: 'none' | 'share' | 'privacy' | 'diagram' | 'reference' | 'examples'
}

export interface JVM {
  classfile?: ClassFile
}

export interface WorkspaceState {
  world: World
  ui: Ui
  code: string
  jvm: JVM
}

export interface CoreState {
  workSpace: WorkspaceState
}

export interface CoreRefs {
  state: CoreState
}
