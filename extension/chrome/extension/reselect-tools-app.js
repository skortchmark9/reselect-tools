import React from 'react';
import ReactDOM from 'react-dom';
import Root from '../../app/containers/Root';
import './reselect-tools-app.css';

import * as api from './page-api';

import createStore from '../../app/store/configureStore';
import createApiMiddleware from '../../app/utils/apiMiddleware';

const checkSelector = (id) => {
  if (id === 'c') {
    return Promise.resolve({ inputs: [1], output: {hey: 'hey'}, id, name: id });
  }
  if (id === 'b') {
    return Promise.resolve({ inputs: [1], output: 5, id, name: id });
  }
  if (id === 'a') {
    return Promise.resolve({ inputs: [5], output: 5, id, name: id });
  }
  return Promise.resolve({ inputs: [], output: 2, id, name: id });
};

const mockApi = {
  checkSelector,
  selectorGraph: () => {
    const a = { id: 'a', recomputations: 10, isNamed: true };
    const b = { id: 'b', recomputations: 10, isNamed: true };
    const c = { id: 'c', recomputations: 10, isNamed: true };
    const d = { id: 'd', recomputations: 2, isNamed: true };
    const e = { id: 'e', recomputations: 4, isNamed: true };
    const f = { id: 'f', recomputations: 6, isNamed: true };
    return Promise.resolve({ nodes: { a, b, c, d, e, f }, edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }] });
  },
};


const apiMiddleware = createApiMiddleware(api);
// const apiMiddleware = createApiMiddleware(window.location.origin === 'http://localhost:8000' ? mockApi : api);


const initialState = {};

ReactDOM.render(
  <Root store={createStore(initialState, apiMiddleware)} />,
  document.querySelector('#root')
);
