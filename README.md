# Reselect Tools
[![Travis][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coveralls][coveralls-badge]][coveralls]

Tools for working with the [reselect](https://github.com/reactjs/reselect) library:
*Check selector dependencies, inputs, outputs, and recomputations at any time without refreshing!*

![Graph](examples/extension.png)



```js
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
	recomputations: 1,
    isNamed: false,
    selectorName: 'currentUser$'
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

- [Motivation](#motivation)
- [Getting Started](#getting-started)
- [Example](#example)
- [API](#api)
  - [`getStateWith`](#getstatewithfunc)
  - [`checkSelector`](#checkselectorselector)
  - [`selectorGraph`](#selectorgraphselectorkey--defaultselectorkey)
  - [`registerSelectors`](#registerselectorskeyselectorobj)
- [License](#license)

## Motivation

It's handy to visualize the application state tree with the [Redux Devtools](https://github.com/zalmoxisus/redux-devtools-extension). But I was using selectors a lot, and there was no easy way to visualize the *computed state tree*. So, I created this library to output graphs like this one:

![Graph](examples/graph.png)

This library was intended to be used with the [chrome extension](./extension). However, it can be still be [useful without the chrome extension installed](#without-the-extension). The chrome extension will be useless without this library.

See the original reselect issue [here](https://github.com/reactjs/reselect/issues/279).

## Getting Started

Firstly, I apologize in advance that this section is required. It would be great to match the experience of installing redux devtools or react's. Hopefully the tools will be more tightly integrated with reselect at some point and these steps won't be necessary.

1. Install the Package

        npm install -s reselect-tools

2. Grab the [Chrome Extension](https://chrome.google.com/webstore/detail/reselect-devtools/cjmaipngmabglflfeepmdiffcijhjlbb)

3. Building the Graph:

   In order to start building out the selector graph, we need to tell the devtools about the selectors.
   ```
   import { registerSelectors } from 'reselect-tools'
   registerSelectors({ mySelector$ })
   ```
   If you're keeping all your selectors in the same place, this is dead simple:
   ```
   import * as selectors from './selectors.js'
   registerSelectors(selectors)
   ```

   That's it! At this point you should be able to open the devtools and view the selector graph.

   The tools will automatically discover and name dependencies of the selectors. If you want to override the name of a selector, you can do so:
   ```
   const foo$ = createSelector(bar$, (foo) => foo + 1);
   foo$.selectorName = 'bar$' // selector will show up as 'bar'
   ```

4. Checking Selector Inputs and Outputs

   Imagine that your tests are passing, but you think some selector in your app might be receiving bad input from a depended-upon selector. Where in the chain is the problem? In order to allow ```checkSelector``` and by extension, the extension, to get this information, we need to give Reselect Tools some way of feeding state to a selector.
   ```
   import store from './configureStore'
   ReselectTools.getStateWith(() => store.getState())
   ```

## Example

The example is running [here](http://skortchmark.com/reselect-tools/examples/demo.html). Grab the extension and take a look!

    npm run example

## API

### getStateWith(func)

`getStateWith` accepts a function which returns the current state. This state is then passed into ```checkSelector```. In most cases, this will be ```store.getState()```

### checkSelector(selector)

Outputs information about the selector at the given time.

By default, outputs only the recomputations of the selector.
If you use ```getStateWith```, it will output the selector's input and output values.
If you use ```registerSelectors```, you can pass it the string name of a selector.


```js
const two$ = () => 2;
const four$ = () => 4
const mySelector$ = createSelector(two$, four$, (two, four) => two + four)
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

Nodes in the graph are keyed by string names. The name is determined by the ```selectorKey``` function. This function takes a selector and outputs a string which must be unique and consistent for a given selector. The ```defaultSelectorKey``` looks for a function name, then a match in the registry, and finally resorts to calling `toString` on the selector's ```resultFunc```.

See the [tests](test/test.js#L246) for an alternate selectorKey.


### registerSelectors(keySelectorObj)

Add a named selector to the graph. Set selector names as keys and selectors as values.


### Without The Extension

If you're using an unsupported browser, or aren't happy with the extension, you can still get at the data.

The dev tools bind to your app via this global:
```
  window.__RESELECT_TOOLS__ = {
    selectorGraph,
    checkSelector
  }
```
Even without the devtools, you can call ```__RESELECT_TOOLS__.checkSelector('mySelector$')``` from the developer console or ```__RESELECT_TOOLS__.selectorGraph()``` to see what's going on. If the JSON output of the graph is hard to parse, there's an example of how to create a visual selector graph [here](tests/your-app.js).


## License

MIT

[build-badge]: https://api.travis-ci.org/skortchmark9/reselect-tools.svg?branch=master
[build]: https://travis-ci.org/skortchmark9/reselect-tools

[npm-badge]: https://img.shields.io/npm/v/reselect-tools.svg?style=flat-square
[npm]: https://www.npmjs.org/package/reselect-tools

[coveralls-badge]: https://coveralls.io/repos/github/skortchmark9/reselect-tools/badge.svg?branch=master
[coveralls]: https://coveralls.io/github/skortchmark9/reselect-tools?branch=master
