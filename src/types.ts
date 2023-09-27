import type { OutputSelectorFields, Selector, SelectorArray } from 'reselect'
import type { checkSelector, selectorGraph } from './index'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => unknown

export type ResultSelector = Selector &
  Partial<OutputSelectorFields<AnyFunction, unknown>>

export type SelectorsObject = Record<string, RegisteredSelector>

export type RegisteredSelector = ResultSelector & {
  selectorName?: string
}

export interface Extra {
  inputs?: unknown[]
  output?: ReturnType<RegisteredSelector>
  error?: string
}

export interface CheckSelectorResults extends Extra {
  dependencies: SelectorArray
  recomputations: number | null
  isNamed: boolean
  selectorName: string | null
}
export interface Node {
  recomputations: number | null
  isNamed: boolean
  name: string
}

export interface Edge {
  from: string
  to: string
}

export interface Graph {
  nodes: Record<string, Node>
  edges: Edge[]
}

declare global {
  interface Window {
    __RESELECT_TOOLS__: {
      selectorGraph: typeof selectorGraph
      checkSelector: typeof checkSelector
    }
  }
}
