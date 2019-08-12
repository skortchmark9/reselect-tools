import * as types from '../constants/ActionTypes';

export function uncheckSelector() {
  return { type: types.UNCHECK_SELECTOR };
}

export function checkSelectorFailed(selector) {
  return { type: types.CHECK_SELECTOR_FAILED, payload: { selector } };
}

export function checkSelectorSuccess(selector) {
  return { type: types.CHECK_SELECTOR_SUCCESS, payload: { selector } };
}

export function checkSelector(selector) {
  return { type: types.CHECK_SELECTOR, payload: { selector } };
}


export function getSelectorGraphFailed() {
  return { type: types.GET_SELECTOR_GRAPH_FAILED };
}

export function getSelectorGraphSuccess(graph) {
  return { type: types.GET_SELECTOR_GRAPH_SUCCESS, payload: { graph } };
}

export function getSelectorGraph(resetRecomputations = false) {
  return { type: types.GET_SELECTOR_GRAPH, payload: { resetRecomputations }};
}
