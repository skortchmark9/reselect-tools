import { createSelector } from 'reselect'
let _getState = null
let _allSelectors = new Set()


const _isFunction = (func) => typeof func === 'function'

export function createSelectorWithDependencies(...funcs) {
  let resultFunc = funcs.pop()
  const dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs
  const selector = createSelector(...dependencies, resultFunc)
  selector.dependencies = dependencies
  _allSelectors.add(selector)
  return selector
}

const _isSelector = (selector) => (selector && selector.resultFunc) || _isFunction(selector)

export function registerSelectors(selectors) {
  Object.keys(selectors).forEach((name) => {
    const selector = selectors[name]
    if (_isSelector(selector)) {
      selector.selectorName = name
      _allSelectors.add(selector)
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
    const state = _getState()
    const inputs = dependencies.map((parentSelector) => parentSelector(state))
    const output = selector(state)
    Object.assign(ret, { inputs, output })
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
    checkSelector
  }
}
