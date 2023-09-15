import { OutputSelectorFields, Selector, createSelector } from "reselect";

let _getState: (() => unknown) | null = null;
let _allSelectors = new Set<RegisteredSelector>();

const _isFunction = (func: unknown): func is Function =>
  typeof func === "function";

/*
 * This function is only exported for legacy purposes.
 * It will be removed in future versions.
 *
 */
export const createSelectorWithDependencies = (
  ...args: Parameters<typeof createSelector>
) => createSelector(...args);

export type UnknownFunction = (...args: unknown[]) => unknown;

export type ResultSelector = Selector &
  OutputSelectorFields<UnknownFunction, unknown>;

const _isMemoizedSelector = (
  selector: UnknownFunction
): selector is ResultSelector => "resultFunc" in selector;

const _isSelector = (
  selector: ResultSelector | undefined
): selector is ResultSelector =>
  !!selector && (_isMemoizedSelector(selector) || _isFunction(selector));

const _addSelector = <S extends RegisteredSelector>(selector: S) => {
  _allSelectors.add(selector);

  const dependencies =
    (selector.dependencies as readonly RegisteredSelector[]) || [];
  dependencies.forEach(_addSelector);
};

export type ObjectSelectors = {
  [K: string]: ResultSelector;
};

export type RegisteredSelector = ResultSelector & {
  selectorName: string;
};

export const registerSelectors = <S extends ObjectSelectors>(selectors: S) => {
  (Object.keys(selectors) satisfies (keyof S)[]).forEach(name => {
    const selector = selectors[name];
    if (_isSelector(selector)) {
      (selector as RegisteredSelector).selectorName = name;
      _addSelector(selector as RegisteredSelector);
    }
  });
};

export function reset() {
  _getState = null;
  _allSelectors = new Set();
}

export const checkSelector = <S extends RegisteredSelector>(selector: S) => {
  if (typeof selector === "string") {
    for (const possibleSelector of _allSelectors) {
      if ((possibleSelector as S).selectorName === selector) {
        selector = possibleSelector as S;
        break;
      }
    }
  }

  if (!_isFunction(selector)) {
    throw new Error(
      `Selector ${selector} is not a function...has it been registered?`
    );
  }

  const { dependencies = [], selectorName = null } = selector;

  const isNamed = typeof selectorName === "string";
  const recomputations = selector.recomputations
    ? selector.recomputations()
    : null;

  const ret = { dependencies, recomputations, isNamed, selectorName };
  if (_getState) {
    const extra = {} as {
      inputs: unknown[];
      output: ReturnType<RegisteredSelector>;
      error: string;
    };
    const state = _getState();

    try {
      extra.inputs = dependencies.map(parentSelector => parentSelector(state));

      try {
        extra.output = selector(state);
      } catch (err) {
        extra.error = `checkSelector: error getting output of selector ${selectorName}. The error was:\n${err}`;
      }
    } catch (err) {
      extra.error = `checkSelector: error getting inputs of selector ${selectorName}. The error was:\n${err}`;
    }

    Object.assign(ret, extra);
  }

  return ret;
};

export const getStateWith = (stateGetter: UnknownFunction) => {
  _getState = stateGetter;
};

const _sumString = (str: UnknownFunction) =>
  Array.from(str.toString()).reduce((sum, char) => char.charCodeAt(0) + sum, 0);

const defaultSelectorKey = (selector: RegisteredSelector) => {
  if (selector.selectorName) {
    return selector.selectorName;
  }

  if (selector.name) {
    // if it's a vanilla function, it will have a name.
    return selector.name;
  }

  return (selector.dependencies || []).reduce((base, dep) => {
    return base + _sumString(dep);
  }, (selector.resultFunc ? selector.resultFunc : selector).toString());
};

export function selectorGraph(selectorKey = defaultSelectorKey) {
  const graph = { nodes: {}, edges: [] };
  const addToGraph = (selector: RegisteredSelector) => {
    const name = selectorKey(selector);
    if (graph.nodes[name]) return;
    const { recomputations, isNamed } = checkSelector(selector);
    graph.nodes[name] = {
      recomputations,
      isNamed,
      name,
    };

    const dependencies = selector.dependencies || [];
    dependencies.forEach(dependency => {
      addToGraph(dependency);
      graph.edges.push({ from: name, to: selectorKey(dependency) });
    });
  };

  for (const selector of _allSelectors) {
    addToGraph(selector);
  }
  return graph;
}

// hack for devtools
/* istanbul ignore if */
if (typeof window !== "undefined") {
  window.__RESELECT_TOOLS__ = {
    selectorGraph,
    checkSelector,
  };
}
