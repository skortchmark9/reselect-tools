import { greaterThan007 } from '../utils/version';

export const supportsRefreshRecomputations$ = state => greaterThan007(state.version);

export const checkedSelector$ = (state) => {
  const { checkedSelectorId, nodes, edges } = state.graph;
  const selector = nodes[checkedSelectorId];
  if (!selector) return;

  // this is a bit ugly because it relies on edges being in order.
  const dependencies = edges.filter(edge => edge.from === checkedSelectorId);
  const dependencyIds = dependencies.map(edge => edge.to);

  if (!selector.inputs) {
    return selector;
  }

  const { inputs } = selector;
  if (dependencyIds.length !== inputs.length) {
    console.error(`Uh oh, inputs and edges out of sync on ${checkedSelectorId}`);
  }

  const zipped = [];
  for (let i = 0; i < dependencyIds.length; i++) {
    zipped.push([dependencyIds[i], inputs[i]]);
  }
  return { ...selector, zipped };
};
