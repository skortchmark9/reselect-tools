import * as types from '../../app/constants/ActionTypes';
import {
  checkSelectorSuccess,
  checkSelectorFailed,
  getSelectorGraphSuccess,
  getSelectorGraphFailed,
 } from '../../app/actions/graph';

export default api => store => next => async (action) => {
  const result = next(action);
  if (action.type === types.CHECK_SELECTOR) {
    const { selector } = action.payload;
    const { id } = selector;
    try {
      const checked = await api.checkSelector(id);
      store.dispatch(checkSelectorSuccess({ ...checked, id }));
    } catch (e) {
      store.dispatch(checkSelectorFailed(selector));
    }
    return result;
  }

  if (action.type === types.GET_SELECTOR_GRAPH) {
    try {
      const graph = await api.selectorGraph();
      store.dispatch(getSelectorGraphSuccess(graph));
    } catch (e) {
      store.dispatch(getSelectorGraphFailed());
    }
  }

  return result;
};
