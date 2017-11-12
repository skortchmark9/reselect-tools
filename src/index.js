import { createSelector } from 'reselect';
import { objectHash } from 'object-hash';

const _registered = {};
let _getState = null;
let _allSelectors = new Set();


const _isFunction = (func) => typeof func === 'function';

export function createSelectorWithDependencies(...funcs) {
  let resultFunc = funcs.pop();
  const dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs;
  const selector = createSelector(...dependencies, resultFunc);
  selector.dependencies = dependencies;
  _allSelectors.add(selector);
  return selector;
}


export function registerSelectors(selectors) {
  const actuallySelectors = {};
  Object.keys(selectors).forEach((key) => {
    const selector = selectors[key];
    if (selector.resultFunc || _isFunction(selector)) {
      actuallySelectors[key] = selector;
    }
  });
  return Object.assign(_registered, actuallySelectors);
}

function _unregisterSelectors() {
  Object.keys(_registered).forEach((key) => {
    delete _registered[key];
  });
}


export function reset() {
  _unregisterSelectors();
  _getState = null;
  _allSelectors = new Set();
}


export function checkSelector(selector) {
  if (typeof selector === 'string') {
    selector = _registered[selector];
  }

  if (!_isFunction(selector)) {
    throw error(`Selector ${selector} is not a function`);
  }

  const { dependencies = [] } = selector;
  const recomputations = selector.recomputations ? selector.recomputations() : 'N/A/';

  const ret = { dependencies, recomputations };
  if (_getState) {
    const state = _getState();
    const inputs = dependencies.map((parentSelector) => parentSelector(state));
    const output = selector(state);
    Object.assign(ret, { inputs, output });
  }

  return ret;
}


export function getStateWith(stateGetter) {
  _getState = stateGetter;
}


function splitOnce(str, token) {
  const components = str.split(token);
  return components.length === 1 ? components : [components.shift(), components.join(token)];
}

function _sumString(str) {
  return Array.from(str.toString()).reduce((sum, char) => char.charCodeAt(0) + sum, 0);
}

const defaultSelectorKey = (selector, registry) => {
  if (selector.name) { // if its a vanilla function, it will have a name.
    return selector.name;
  }

  for (let key of Object.keys(registry)) {
    if (registry[key] === selector) {
      return key;
    }
  }

  return (selector.dependencies || []).reduce((base, dep) => {
    return base + _sumString(dep);
  }, selector.resultFunc.toString());
}

export function selectorGraph(selectorKey = defaultSelectorKey) {
    const graph = { nodes: {}, edges: [] };
    const traversedDependencies = new Set();

    const addToGraph = (selector) => {
      const name = selectorKey(selector, _registered);
      graph.nodes[name] = {
        recomputations: selector.recomputations ? selector.recomputations() : 'N/A',
        name,
      };

      let dependencies = selector.dependencies || [];
      if (traversedDependencies.has(name)) { // Don't re-add.
        dependencies = [];
      }
      dependencies.forEach((dependency) => {
        addToGraph(dependency);
        graph.edges.push({ from: name, to: selectorKey(dependency, _registered) });
      });
      traversedDependencies.add(name);
    }

    for (let selector of _allSelectors) {
      addToGraph(selector);
    }
    return graph;
}