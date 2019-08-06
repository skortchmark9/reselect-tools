import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from '../reducers';


export default function (initialState, ...middlewares) {
  const enhancer = compose(
    applyMiddleware(thunk, ...middlewares),
  );

  return createStore(rootReducer, initialState, enhancer);
}
