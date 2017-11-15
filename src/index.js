import { createSelector } from 'reselect'
const _registered = {}
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


export function registerSelectors(selectors) {
  const actuallySelectors = {}
  Object.keys(selectors).forEach((key) => {
    const selector = selectors[key]
    if (selector.resultFunc || _isFunction(selector)) {
      actuallySelectors[key] = selector
    }
  })
  return Object.assign(_registered, actuallySelectors)
}

function _unregisterSelectors() {
  Object.keys(_registered).forEach((key) => {
    delete _registered[key]
  })
}


export function reset() {
  _unregisterSelectors()
  _getState = null
  _allSelectors = new Set()
}


export function checkSelector(selector) {

  let isRegistered = false
  if (typeof selector === 'string' && _isFunction(_registered[selector])) {
    selector = _registered[selector]
    isRegistered = true
  }

  if (!_isFunction(selector)) {
    throw new Error(`Selector ${selector} is not a function...has it been registered?`)
  }

  if (!isRegistered) {
    Object.keys(_registered).forEach((key) => {
      if (_registered[key] === selector) {
        isRegistered = true
      }
    })
  }

  const dependencies = selector.dependencies || []
  const recomputations = selector.recomputations ? selector.recomputations() : null

  const ret = { dependencies, recomputations, isRegistered }
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

const defaultSelectorKey = (selector, registry) => {
  if (selector.name) { // if it's a vanilla function, it will have a name.
    return selector.name
  }

  for (let key of Object.keys(registry)) {
    if (registry[key] === selector) {
      return key
    }
  }

  return (selector.dependencies || []).reduce((base, dep) => {
    return base + _sumString(dep)
  }, (selector.resultFunc ? selector.resultFunc : selector).toString())
}

export function selectorGraph(selectorKey = defaultSelectorKey) {
  const graph = { nodes: {}, edges: [] }
  const traversedDependencies = new Set()

  const addToGraph = (selector) => {
    if (graph.nodes[name]) return
    const name = selectorKey(selector, _registered)
    const { recomputations, isRegistered } = checkSelector(selector)
    graph.nodes[name] = {
      recomputations,
      isRegistered,
      name
    }

    let dependencies = selector.dependencies || []
    if (traversedDependencies.has(name)) { // Don't re-add.
      dependencies = []
    }
    dependencies.forEach((dependency) => {
      addToGraph(dependency)
      graph.edges.push({ from: name, to: selectorKey(dependency, _registered) })
    })
    traversedDependencies.add(name)
  }

  for (let selector of _allSelectors) {
    addToGraph(selector)
  }
  return graph
}
