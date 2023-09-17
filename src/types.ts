import type { OutputSelectorFields, Selector, SelectorArray } from 'reselect'
import type { checkSelector, selectorGraph } from '.'

export type UnknownFunction = (...args: unknown[]) => unknown

export type AnyFunction = (...args: any[]) => unknown

export type ResultSelector = Selector &
  Partial<OutputSelectorFields<AnyFunction, unknown>>

export type ObjectSelectors = Record<string, RegisteredSelector>

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

declare global {
  interface Window {
    __RESELECT_TOOLS__: {
      selectorGraph: typeof selectorGraph
      checkSelector: typeof checkSelector
    }
  }
}

export interface Graph {
  nodes: Record<
    string,
    {
      recomputations: number | null
      isNamed: boolean
      name: string
    }
  >
  edges: {
    from: string
    to: string
  }[]
}
