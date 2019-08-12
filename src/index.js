import { createSelector } from 'reselect'

let _getState = null
let _allSelectors = new Set()


const _isFunction = (func) => typeof func === 'function'

/*
 * This function is only exported for legacy purposes.
 * It will be removed in future versions.
 *
 */
export function createSelectorWithDependencies(...args) {
  return createSelector(...args)
}

const _isSelector = (selector) => (selector && selector.resultFunc) || _isFunction(selector)

const _addSelector = (selector) => {
  _allSelectors.add(selector)

  const dependencies = selector.dependencies || []
  dependencies.forEach(_addSelector)
}

export function registerSelectors(selectors) {
  Object.keys(selectors).forEach((name) => {
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


export function checkSelector(selector) {
  if (typeof selector === 'string') {
    for (const possibleSelector of _allSelectors) {
      if (possibleSelector.selectorName === selector) {
        selector = possibleSelector
        break
      }
    }
  }

  if (!_isFunction(selector)) {
    throw new Error(`Selector ${selector} is not a function...has it been registered?`)
  }


  const { dependencies = [], selectorName = null } = selector

  const isNamed = typeof selectorName === 'string'
  const recomputations = selector.recomputations ? selector.recomputations() : null

  const ret = { dependencies, recomputations, isNamed, selectorName }
  if (_getState) {
    const extra = {}
    const state = _getState()

    try {
      extra.inputs = dependencies.map((parentSelector) => parentSelector(state))

      try {
        extra.output = selector(state)
      } catch (e) {
        extra.error = `checkSelector: error getting output of selector ${selectorName}. The error was:\n${e}`
      }
    } catch (e) {
      extra.error = `checkSelector: error getting inputs of selector ${selectorName}. The error was:\n${e}`
    }

    Object.assign(ret, extra)
  }

  return ret
}


export function getStateWith(stateGetter) {
  _getState = stateGetter
}


function _sumString(str) {
  return Array.from(str.toString()).reduce((sum, char) => char.charCodeAt(0) + sum, 0)
}

const defaultSelectorKey = (selector) => {
  if (selector.selectorName) {
    return selector.selectorName
  }

  if (selector.name) { // if it's a vanilla function, it will have a name.
    return selector.name
  }

  return (selector.dependencies || []).reduce((base, dep) => {
    return base + _sumString(dep)
  }, (selector.resultFunc ? selector.resultFunc : selector).toString())
}

export function selectorGraph(selectorKey = defaultSelectorKey) {
  const graph = { nodes: {}, edges: [] }
  const addToGraph = (selector) => {
    const name = selectorKey(selector)
    if (graph.nodes[name]) return
    const { recomputations, isNamed } = checkSelector(selector)
    graph.nodes[name] = {
      recomputations,
      isNamed,
      name
    }

    let dependencies = selector.dependencies || []
    dependencies.forEach((dependency) => {
      addToGraph(dependency)
      graph.edges.push({ from: name, to: selectorKey(dependency) })
    })
  }

  for (let selector of _allSelectors) {
    addToGraph(selector)
  }
  return graph
}

// hack for devtools
/* istanbul ignore if */
if (typeof window !== 'undefined') {
  window.__RESELECT_TOOLS__ = {
    selectorGraph,
    checkSelector,
    _allSelectors,
    version: '0.0.8'
  }
}
