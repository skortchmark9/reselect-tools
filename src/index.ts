import type { Selector } from 'reselect'
import { createSelector } from 'reselect'
import type {
  AnyFunction,
  CheckSelectorResults,
  Extra,
  Graph,
  RegisteredSelector,
  SelectorsObject
} from './types'
export type {
  AnyFunction,
  CheckSelectorResults,
  Edge,
  Extra,
  Graph,
  Node,
  RegisteredSelector,
  ResultSelector,
  SelectorsObject
} from './types'

let _getState: (() => unknown) | null = null
let _allSelectors = new Set<RegisteredSelector>()

const _isFunction = (func: unknown): func is AnyFunction =>
  typeof func === 'function'

/**
 * This function is only exported for legacy purposes.
 * It will be removed in future versions.
 */
export function createSelectorWithDependencies(
  ...args: Parameters<typeof createSelector>
) {
  return createSelector(...args)
}

const _isSelector = (selector: unknown): selector is Selector =>
  (!!selector && typeof selector === 'object' && 'resultFunc' in selector) ||
  _isFunction(selector)

const _addSelector = <S extends RegisteredSelector>(selector: S) => {
  _allSelectors.add(selector)

  const dependencies = selector.dependencies ?? []
  dependencies.forEach(_addSelector)
}
/**
 * Adds named selectors to the graph. It sets selector names as keys and selectors as values.
 * @param selectors A key value pair object where the keys are selector names and the values are the selectors themselves.
 */
export function registerSelectors<S extends SelectorsObject>(selectors: S) {
  Object.keys(selectors).forEach(name => {
    const selector = selectors[name]
    if (_isSelector(selector)) {
      selector.selectorName = name
      _addSelector(selector)
    }
  })
}

export function reset() {
  _getState = null
  _allSelectors = new Set()
}
/**
 * Outputs information about the selector at the given time. By default, outputs only the recomputations of the selector.
 * If you use `getStateWith`, it will output the selector's input and output values. If you use `registerSelectors`, you can pass it the string name of a selector.
 * @param selector Either a selector or the string name of a selector.
 * @returns Information about the selector at the given time.
 */
export function checkSelector(selector: RegisteredSelector | string) {
  if (typeof selector === 'string') {
    for (const possibleSelector of _allSelectors) {
      if (possibleSelector.selectorName === selector) {
        selector = possibleSelector
        break
      }
    }
  }

  if (!_isFunction(selector)) {
    throw new Error(
      `Selector ${JSON.stringify(
        selector
      )} is not a function...has it been registered?`
    )
  }

  const { dependencies = [], selectorName = null } = selector

  const isNamed = typeof selectorName === 'string'
  const recomputations = selector.recomputations
    ? selector.recomputations()
    : null

  const ret: CheckSelectorResults = {
    dependencies,
    recomputations,
    isNamed,
    selectorName
  }
  if (_getState) {
    const extra: Extra = {}
    const state = _getState()

    try {
      extra.inputs = dependencies.map(parentSelector => parentSelector(state))

      try {
        extra.output = selector(state)
      } catch (e) {
        extra.error = `checkSelector: error getting output of selector ${selectorName}. The error was:\n${
          e instanceof TypeError ? e.message : JSON.stringify(e)
        }`
      }
    } catch (e) {
      extra.error = `checkSelector: error getting inputs of selector ${selectorName}. The error was:\n${
        e instanceof TypeError ? e.message : JSON.stringify(e)
      }`
    }

    Object.assign(ret, extra)
  }

  return ret
}
/**
 * Accepts a function which returns the current state. This state is then passed into `checkSelector`. In most cases, this will be `store.getState()`
 * @param stateGetter A function which returns the current state.
 */
export function getStateWith<T extends AnyFunction | null>(stateGetter: T) {
  _getState = stateGetter
}

function _sumString(str: AnyFunction) {
  return Array.from(str.toString()).reduce(
    (sum, char) => char.charCodeAt(0) + sum,
    0
  )
}
/**
 * Looks for a function name, then a match in the registry, and finally resorts to calling `toString` on the selector's `resultFunc`.
 * @param selector The selector whose name will be extracted as the key.
 * @returns The name of the function or it's `resultFunc` stringified.
 */
const defaultSelectorKey = (selector: RegisteredSelector) => {
  if (selector.selectorName) {
    return selector.selectorName
  }

  if (selector.name) {
    // if it's a vanilla function, it will have a name.
    return selector.name
  }

  return (selector.dependencies ?? []).reduce(
    (base, dep) => {
      return base + _sumString(dep)
    },
    (selector.resultFunc ? selector.resultFunc : selector).toString()
  )
}
/**
 * Outputs a POJO with nodes and edges. A node is a selector in the tree, and an edge goes from a selector to the selectors it depends on.
 * @param selectorKey An optional callback function that takes a selector and outputs a string which must be unique and consistent for a given selector. @default defaultSelectorKey
 * @returns A graph which is a POJO with nodes and edges. A node is a selector in the tree, and an edge goes from a selector to the selectors it depends on.
 */
export function selectorGraph(selectorKey = defaultSelectorKey) {
  const graph: Graph = { nodes: {}, edges: [] }
  const addToGraph = <S extends RegisteredSelector>(selector: S) => {
    const name = selectorKey(selector)
    if (graph.nodes[name]) return
    const { recomputations, isNamed } = checkSelector(selector)
    graph.nodes[name] = {
      recomputations,
      isNamed,
      name
    }

    const dependencies = selector.dependencies ?? []
    dependencies.forEach(dependency => {
      addToGraph(dependency)
      graph.edges.push({
        from: name,
        to: selectorKey(dependency)
      })
    })
  }

  for (const selector of _allSelectors) {
    addToGraph(selector)
  }
  return graph
}

// hack for devtools
/* istanbul ignore if */
if (typeof window !== 'undefined') {
  window.__RESELECT_TOOLS__ = {
    selectorGraph,
    checkSelector
  }
}
