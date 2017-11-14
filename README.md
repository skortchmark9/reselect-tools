# Reselect Tools
[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coveralls][coveralls-badge]][coveralls]

Some tools for working with the [reselect](https://github.com/reactjs/reselect) library:

* Check selector dependencies, inputs, outputs, and recomputations at any time.
* Output a JSON representation of your selector graph (soon to be a visual browser extension!)


```js
// in selectors.js
import {
	createSelectorWithDependencies as createSelector
} from 'reselect-tools'


export const data$ = (state) => state.data;
export const ui$ = (state) => state.ui;
export const users$ = createSelector(data$, (data) => data.users);
export const currentUser$ = createSelector(ui$, users$, (ui, users) => users[ui.currentUser]);
...

// in configureStore.js
import * as selectors from './selectors.js'
import * as ReselectTools from 'reselect-tools'

ReselectTools.getStateWith(() => store.getState())  // allows you to get selector inputs and outputs
ReselectTools.registerSelectors(selectors) // register string names for selectors
...
ReselectTools.checkSelector('currentUser$')
=> {
	inputs: [{currentUser: 1}, users: {1: {name: 'sam'}}]
	outputs: {name: 'sam'},
	dependencies: [ui$, users$],
	recomputations: 1
}
selectorGraph()
=> {
	nodes: {
		"data$": {
			name: "data$",
			recomputations: "N/A"
		},
		"ui$": {
			name: "ui$",
			recomputations: "N/A"
		},
		"users$": {
			name: "user$",
			recomputations: 1
		},
		"currentUser$": {
			name: "currentUser$",
			recomputations: 1
		},
	},
	edges: [
		{ from: users$, to: data$ },
		{ from: users$, to: data$ },
		{ from: currentUser$, to: users$ },
		{ from: currentUser$, to: ui$ },
	]
}
```

## Table of Contents

- [Installation](#installation)
- [Motivation](#motivation)
- [Example](#example)
- [API](#api)
  - [`createSelectorWithDependencies`](#createselectorwithdependenciesinputselectors--inputselectors-resultfunc)
  - [`getStateWith`](#getstatewithfunc)
  - [`checkSelector`](#checkselectorselector)
  - [`selectorGraph`](#selectorgraphselectorkey--defaultselectorkey)
- [License](#license)

## Installation
    npm install reselect-tools


## Motivation

It's handy to visualize the application state tree with the [Redux Devtools](https://github.com/zalmoxisus/redux-devtools-extension). But I was using selectors a lot, and there was no easy way to visualize the *computed state tree*. So, I created this library to output graphs like this one:

![Graph](examples/graph.png)

I am writing a chrome extension to take the output of selectorGraph() and create a graph inside the devtools, but you can use this library today for ```checkSelector``` and to create selector graphs statically (see the [example](#example)).

See the original reselect issue [here](https://github.com/reactjs/reselect/issues/279).


## Example
    npm run example

## API

### createSelectorWithDependencies(...inputSelectors | [inputSelectors], resultFunc)

Calls down to Reselect's `createSelector`, but adds ```inputSelectors``` as an array of ```.dependencies``` on the returned selector.

```js
const vanillaSelector1 = state => state.values.value1
const vanillaSelector2 = state => state.values.value2
const mySelector = createSelectorWithDependencies(
  vanillaSelector1,
  vanillaSelector2,
  (value1, value2) => value1 + value2
)

mySelector.dependencies[0] // vanillaSelector1
mySelector.dependencies[1] // vanillaSelector2
```


### getStateWith(func)

`getStateWith` accepts a function which returns the current state. This state is then passed into ```checkSelector```. In most cases, this will be ```store.getState()```

### checkSelector(selector)

Outputs information about the selector at the given time.

By default, outputs only the recomputations of the selector.
If you use ```createSelectorWithDependencies```, it will also output the selector's dependencies.
If you use ```getStateWith```, it will output the selector's input and output values.
If you use ```registerSelectors```, you can pass it the string name of a selector.


```js
const two$ = () => 2;
const four$ = () => 4
const mySelector$ = createSelectorWithDependencies(two$, four$, (two, four) => two + four)
registerSelectors({ mySelector$ })
getStateWith(() => null)

checkSelector('mySelector$')  // {
									 inputs: [2, 4],
									 output: 6,
									 dependencies: [two$, four$],
									 recomputations: 1,
								 }
```


### selectorGraph(selectorKey = defaultSelectorKey)

```selectorGraph``` outputs a POJO with nodes and edges. A node is a selector in the tree, and an edge goes from a selector to the selectors it depends on.

```js
selectorGraph()
//  {
//  	nodes: {
//  		"data$": {
//  			name: "data$",
//  			recomputations: "N/A"
//  		},
//  		"ui$": {
//  			name: "ui$",
//  			recomputations: "N/A"
//  		},
//  		"users$": {
//  			name: "user$",
//  			recomputations: 1
//  		},
//  		"currentUser$": {
//  			name: "currentUser$",
//  			recomputations: 1
//  		},
//  	},
//  	edges: [
//  		{ from: users$, to: data$ },
//  		{ from: users$, to: data$ },
//  		{ from: currentUser$, to: users$ },
//  		{ from: currentUser$, to: ui$ },
//  	]
//  }
```

#### Using custom selectorKeys

Nodes in the graph are keyed by string names. The name is determined by the ```selectorKey``` function. This function takes a selector and the registry populated from ```registerSelectors```. The ```defaultSelectorKey``` looks for a function name, then a match in the registry, and finally resorts to calling toString on the selector's ```resultFunc```.

See the [tests](test/test.js#L246) for an alternate selectorKey.

## License

MIT

[build-badge]: https://api.travis-ci.org/skortchmark9/reselect-tools.svg?branch=master
[build]: https://travis-ci.org/skortchmark9/reselect-tools

[npm-badge]: https://img.shields.io/npm/v/reselect-tools.svg?style=flat-square
[npm]: https://www.npmjs.org/package/reselect-tools

[coveralls-badge]: https://coveralls.io/repos/github/skortchmark9/reselect-tools/badge.svg?branch=master
[coveralls]: https://coveralls.io/github/skortchmark9/reselect-tools?branch=master
