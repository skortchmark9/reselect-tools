import * as ActionTypes from '../constants/ActionTypes';

const initialState = {
  fetching: false,
  fetchedSuccessfully: false,
  fetchedOnce: false,
  nodes: {},
  edges: [],
  checkedSelectorId: null,
};

const actionsMap = {
  [ActionTypes.GET_SELECTOR_GRAPH_FAILED](state) {
    return { ...state, fetching: false, fetchedSuccessfully: false };
  },
  [ActionTypes.GET_SELECTOR_GRAPH_SUCCESS](state, action) {
    const { nodes, edges } = action.payload.graph;
    const oldNodes = state.nodes;
    const mergedNodes = {};
    Object.keys(nodes).forEach((id) => {
      const node = { id, ...oldNodes[id], ...nodes[id] };
      if (node.isNamed === undefined) {
        node.isNamed = node.isRegistered;
      }
      mergedNodes[id] = node;
    });

    return {
      ...state,
      fetching: false,
      nodes: mergedNodes,
      edges,
      fetchedSuccessfully: true
    };
  },
  [ActionTypes.GET_SELECTOR_GRAPH](state) {
    return {
      ...state,
      fetchedOnce: true,
      fetching: true,
    };
  },
  [ActionTypes.UNCHECK_SELECTOR](state) {
    return { ...state, checkedSelectorId: null };
  },
  [ActionTypes.CHECK_SELECTOR_SUCCESS](state, action) {
    const { selector } = action.payload;
    const { nodes } = state;
    const { id } = selector;
    return {
      ...state,
      checkedSelectorId: id,
      nodes: {
        ...nodes,
        [id]: { ...nodes[id], ...selector }
      }
    };
  },
  [ActionTypes.CHECK_SELECTOR_FAILED](state, action) {
    // set it anyway
    return { ...state, checkedSelectorId: action.payload.selector.id };
  },
};

export default function graph(state = initialState, action) {
  const reduceFn = actionsMap[action.type];
  if (!reduceFn) return state;
  return reduceFn(state, action);
}
