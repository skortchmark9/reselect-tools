function defaultEqualityCheck(a, b) {
  return a === b
}

function areArgumentsShallowlyEqual(equalityCheck, prev, next) {
  if (prev === null || next === null || prev.length !== next.length) {
    return false
  }

  // Do this in a for loop (and not a `forEach` or an `every`) so we can determine equality as fast as possible.
  const length = prev.length
  for (let i = 0; i < length; i++) {
    if (!equalityCheck(prev[i], next[i])) {
      return false
    }
  }

  return true
}

export function defaultMemoize(func, equalityCheck = defaultEqualityCheck) {
  let lastArgs = null
  let lastResult = null
  // we reference arguments instead of spreading them for performance reasons
  return function () {
    if (!areArgumentsShallowlyEqual(equalityCheck, lastArgs, arguments)) {
      // apply arguments instead of spreading for performance.
      lastResult = func.apply(null, arguments)
    }

    lastArgs = arguments
    return lastResult
  }
}

function getDependencies(funcs) {
  const dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs

  if (!dependencies.every(dep => typeof dep === 'function')) {
    const dependencyTypes = dependencies.map(
      dep => typeof dep
    ).join(', ')
    throw new Error(
      'Selector creators expect all input-selectors to be functions, ' +
      `instead received the following types: [${dependencyTypes}]`
    )
  }

  return dependencies
}

export function createSelectorCreator(memoize, ...memoizeOptions) {
  return (...funcs) => {
    let recomputations = 0
    const resultFunc = funcs.pop()
    const dependencies = getDependencies(funcs)

    const memoizedResultFunc = memoize(
      function () {
        recomputations++
        // apply arguments instead of spreading for performance.
        return resultFunc.apply(null, arguments)
      },
      ...memoizeOptions
    )

    // If a selector is called with the exact same arguments we don't need to traverse our dependencies again.
    const selector = defaultMemoize(function () {
      const params = []
      const length = dependencies.length

      for (let i = 0; i < length; i++) {
        // apply arguments instead of spreading and mutate a local list of params for performance.
        params.push(dependencies[i].apply(null, arguments))
      }

      // apply arguments instead of spreading for performance.
      return memoizedResultFunc.apply(null, params)
    })

    selector.resultFunc = resultFunc
    selector.recomputations = () => recomputations
    selector.resetRecomputations = () => recomputations = 0
    return selector
  }
}

export const createSelector = createSelectorCreator(defaultMemoize)

export function createStructuredSelector(selectors, selectorCreator = createSelector) {
  if (typeof selectors !== 'object') {
    throw new Error(
      'createStructuredSelector expects first argument to be an object ' +
      `where each property is a selector, instead received a ${typeof selectors}`
    )
  }
  const objectKeys = Object.keys(selectors)
  return selectorCreator(
    objectKeys.map(key => selectors[key]),
    (...values) => {
      return values.reduce((composition, value, index) => {
        composition[objectKeys[index]] = value
        return composition
      }, {})
    }
  )
}




/* This is where the realness starts */
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
  // TODO: do we need to mutate this
  _allSelectors = new Set();
}


export function checkSelector(selector) {
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


const defaultSelectorKey = (selector) => {
  if (selector.name) {
    return selector.name;      
  }

  for (let key of Object.keys(_registered)) {
    if (_registered[key] === selector) {
      return key;
    }
  }

  const code = selector.resultFunc.toString();
  const split = splitOnce(code, '=> ');
  if (split.length === 1) {
    return split[0];
  } else {
    return split[1];
  }
}

const selectorKeyFactory = (selectorNames) => (selector) => {
  for (let name of Object.keys(_registered)) {
    if (_registered[name] === selector) {
      return name;
    }
  }
  return defaultSelectorKey(selector);
}


export function selectorGraph(selectorKey = defaultSelectorKey) {
    const graph = { nodes: {}, edges: [] };
    const traversedDependencies = new Set();

    const addToGraph = (selector) => {
      const name = selectorKey(selector);
      graph.nodes[name] = {
        recomputations: selector.recomputations ? selector.recomputations() : 'N/A',
        name,
      };

      let dependencies = selector.dependencies || [];
      if (traversedDependencies.has(name)) {
        dependencies = [];
      }
      dependencies.forEach((dependency) => {
        const depKey = selectorKey(dependency);
        addToGraph(dependency);
        graph.edges.push({ from: name, to: depKey });
      });
      traversedDependencies.add(name);
    }

    for (let selector of _allSelectors) {
      addToGraph(selector);
    }
    return graph;
}