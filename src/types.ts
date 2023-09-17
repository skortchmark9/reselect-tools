import type { OutputSelectorFields, Selector } from 'reselect'
import type { checkSelector, selectorGraph } from '.'

export type UnknownFunction = (...args: unknown[]) => unknown

export type AnyFunction = (...args: any[]) => unknown

export type ResultSelector = Selector &
  Partial<OutputSelectorFields<AnyFunction, unknown>>

export type ObjectSelectors = Record<
  string,
  ResultSelector & {
    selectorName?: string
  }
>

export type RegisteredSelector = ResultSelector & {
  selectorName?: string
}

export interface Extra {
  inputs: unknown[]
  output: ReturnType<RegisteredSelector>
  error: string
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
