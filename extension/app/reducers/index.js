import { combineReducers } from 'redux';
import graph from './graph';

const identity = (x = null) => x;

export default combineReducers({
  graph,
  // we provide this so combineReducers doesnt complain about initial state
  version: identity,
});
