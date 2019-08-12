'use strict';

exports.__esModule = true;
exports.createSelectorWithDependencies = createSelectorWithDependencies;
exports.registerSelectors = registerSelectors;
exports.reset = reset;
exports.checkSelector = checkSelector;
exports.getStateWith = getStateWith;
exports.selectorGraph = selectorGraph;

var _reselect = require('reselect');

var _getState = null;
var _allSelectors = new Set();

var _isFunction = function _isFunction(func) {
  return typeof func === 'function';
};

/*
 * This function is only exported for legacy purposes.
 * It will be removed in future versions.
 *
 */
function createSelectorWithDependencies() {
  return _reselect.createSelector.apply(undefined, arguments);
}

var _isSelector = function _isSelector(selector) {
  return selector && selector.resultFunc || _isFunction(selector);
};

var _addSelector = function _addSelector(selector) {
  _allSelectors.add(selector);

  var dependencies = selector.dependencies || [];
  dependencies.forEach(_addSelector);
};

function registerSelectors(selectors) {
  Object.keys(selectors).forEach(function (name) {
    var selector = selectors[name];
    if (_isSelector(selector)) {
      selector.selectorName = name;
      _addSelector(selector);
    }
  });
}

function reset() {
  _getState = null;
  _allSelectors = new Set();
}

function checkSelector(selector) {
  if (typeof selector === 'string') {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = _allSelectors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var possibleSelector = _step.value;

        if (possibleSelector.selectorName === selector) {
          selector = possibleSelector;
          break;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  if (!_isFunction(selector)) {
    throw new Error('Selector ' + selector + ' is not a function...has it been registered?');
  }

  var _selector = selector,
      _selector$dependencie = _selector.dependencies,
      dependencies = _selector$dependencie === undefined ? [] : _selector$dependencie,
      _selector$selectorNam = _selector.selectorName,
      selectorName = _selector$selectorNam === undefined ? null : _selector$selectorNam;


  var isNamed = typeof selectorName === 'string';
  var recomputations = selector.recomputations ? selector.recomputations() : null;

  var ret = { dependencies: dependencies, recomputations: recomputations, isNamed: isNamed, selectorName: selectorName };
  if (_getState) {
    var extra = {};
    var state = _getState();

    try {
      extra.inputs = dependencies.map(function (parentSelector) {
        return parentSelector(state);
      });

      try {
        extra.output = selector(state);
      } catch (e) {
        extra.error = 'checkSelector: error getting output of selector ' + selectorName + '. The error was:\n' + e;
      }
    } catch (e) {
      extra.error = 'checkSelector: error getting inputs of selector ' + selectorName + '. The error was:\n' + e;
    }

    Object.assign(ret, extra);
  }

  return ret;
}

function getStateWith(stateGetter) {
  _getState = stateGetter;
}

function _sumString(str) {
  return Array.from(str.toString()).reduce(function (sum, char) {
    return char.charCodeAt(0) + sum;
  }, 0);
}

var defaultSelectorKey = function defaultSelectorKey(selector) {
  if (selector.selectorName) {
    return selector.selectorName;
  }

  if (selector.name) {
    // if it's a vanilla function, it will have a name.
    return selector.name;
  }

  return (selector.dependencies || []).reduce(function (base, dep) {
    return base + _sumString(dep);
  }, (selector.resultFunc ? selector.resultFunc : selector).toString());
};

function selectorGraph() {
  var selectorKey = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultSelectorKey;

  var graph = { nodes: {}, edges: [] };
  var addToGraph = function addToGraph(selector) {
    var name = selectorKey(selector);
    if (graph.nodes[name]) return;

    var _checkSelector = checkSelector(selector),
        recomputations = _checkSelector.recomputations,
        isNamed = _checkSelector.isNamed;

    graph.nodes[name] = {
      recomputations: recomputations,
      isNamed: isNamed,
      name: name
    };

    var dependencies = selector.dependencies || [];
    dependencies.forEach(function (dependency) {
      addToGraph(dependency);
      graph.edges.push({ from: name, to: selectorKey(dependency) });
    });
  };

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = _allSelectors[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var selector = _step2.value;

      addToGraph(selector);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return graph;
}

// hack for devtools
/* istanbul ignore if */
if (typeof window !== 'undefined') {
  window.__RESELECT_TOOLS__ = {
    selectorGraph: selectorGraph,
    checkSelector: checkSelector,
    _allSelectors: _allSelectors,
    version: '0.0.8'
  };
}