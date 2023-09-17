import type { Selector } from 'reselect'
import { createSelector } from 'reselect'
import type {
  AnyFunction,
  CheckSelectorResults,
  Extra,
  Graph,
  ObjectSelectors,
  RegisteredSelector
} from './types'

let _getState: (() => unknown) | null = null
let _allSelectors = new Set<RegisteredSelector>()

const _isFunction = (func: unknown): func is AnyFunction =>
  typeof func === 'function'

/*
 * This function is only exported for legacy purposes.
 * It will be removed in future versions.
 *
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

export function registerSelectors<S extends ObjectSelectors>(selectors: S) {
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

export function checkSelector(selector: RegisteredSelector) {
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

export function getStateWith<T extends AnyFunction | null>(stateGetter: T) {
  _getState = stateGetter
}

function _sumString(str: AnyFunction) {
  return Array.from(str.toString()).reduce(
    (sum, char) => char.charCodeAt(0) + sum,
    0
  )
}

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
