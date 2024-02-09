import type { Selector, SelectorArray } from 'reselect'
import type { checkSelector, selectorGraph } from './index'

/**
 * Any function with arguments.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any
/**
 * A selector that has been registered using `registerSelectors`.
 */
export type RegisteredSelector = Selector & {
  dependencies?: SelectorArray
  selectorName?: string
  recomputations?: () => number
  resultFunc?: AnyFunction
}

export interface Extra {
  inputs?: unknown[]
  output?: ReturnType<RegisteredSelector>
  error?: string
}
/**
 * Information about the selector returned by calling `checkSelector`.
 */
export interface CheckSelectorResults extends Extra {
  dependencies: SelectorArray
  recomputations: number | null
  isNamed: boolean
  selectorName: string | null
}
/**
 * A node is a selector in the tree.
 */
export interface Node {
  recomputations: number | null
  isNamed: boolean
  name: string
}
/**
 * An edge goes from a selector to the selectors it depends on.
 */
export interface Edge {
  from: string
  to: string
}
/**
 * A POJO with nodes and edges providing information about the selectors.
 */
export interface Graph {
  nodes: Record<string, Node>
  edges: Edge[]
}

declare global {
  interface Window {
    /**
     * The dev tools bind to your app via this global.
     * Even without the devtools, you can call `__RESELECT_TOOLS__.checkSelector('mySelector$')` from the developer console or `__RESELECT_TOOLS__.selectorGraph()` to see what's going on.
     */
    __RESELECT_TOOLS__: {
      selectorGraph: typeof selectorGraph
      checkSelector: typeof checkSelector
    }
  }
}
