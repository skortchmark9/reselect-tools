import chai from 'chai'
import {  
  createSelectorWithDependencies,
  registerSelectors,
  getStateWith,
  checkSelector,
  selectorGraph,
  reset  } from '../src/index'

const assert = chai.assert

beforeEach(reset)

suite('createSelectorWithDependencies', () => {

  test('it creates a selector which has dependencies', () => {
    const func1 = () => 1
    const selector = createSelectorWithDependencies(func1, () => 1)
    assert.equal(selector.dependencies.length, 1)
    assert.equal(selector.dependencies[0], func1)
  })

  test('they can be spread', () => {
    const func1 = (state) => state.func1
    const func2 = (state) => state.func2
    const func3 = (state) => state.func3
    const selector = createSelectorWithDependencies(
      func1, func2, func3, () => 1)
    assert.equal(selector.dependencies.length, 3)
    assert.equal(selector.dependencies[0], func1)
    assert.equal(selector.dependencies[1], func2)
    assert.equal(selector.dependencies[2], func3)
  })

  test('they can be an array', () => {
    const func1 = (state) => state.func1
    const func2 = (state) => state.func2
    const func3 = (state) => state.func3
    const selector = createSelectorWithDependencies(
      [ func1, func2, func3 ], () => 1)
    assert.equal(selector.dependencies.length, 3)
    assert.equal(selector.dependencies[0], func1)
    assert.equal(selector.dependencies[1], func2)
    assert.equal(selector.dependencies[2], func3)
  })

  test('they can be recursive', () => {
    const func1 = (state) => state.func1
    const selector1 = createSelectorWithDependencies(func1, () => 'selector1')

    const func2 = (state) => state.func2
    const func3 = (state) => state.func3
    const selector = createSelectorWithDependencies(
      [ selector1, func2, func3 ], () => 1)
    assert.equal(selector.dependencies.length, 3)
    assert.equal(selector.dependencies[0], selector1)
    assert.equal(selector.dependencies[1], func2)
    assert.equal(selector.dependencies[2], func3)

    assert.equal(selector.dependencies[0].dependencies[0], func1)
  })
})

suite('registerSelectors', () => {

  test('allows you to name selectors', () => {
    const foo = () => 'foo'
    const bar = createSelectorWithDependencies(foo, () => 'bar')
    const baz = createSelectorWithDependencies(bar, foo, () => 'bar')
    const registered = registerSelectors({ foo, bar, baz })

    assert.equal(Object.keys(registered).length, 3)
    assert.equal(registered.foo, foo)
    assert.equal(registered.bar, bar)
    assert.equal(registered.baz, baz)
  })

  test('ignores inputs which are not selectors or functions', () => {
    const foo = () => 'foo'
    const bar = createSelectorWithDependencies(foo, () => 'bar')
    const utilities = {
      identity: x => x
    }
    const selectors = { foo, bar, utilities }
    const registered = registerSelectors(selectors)

    assert.equal(Object.keys(registered).length, 2)
  })

  test('can be called additively', () => {
    const foo = () => 'foo'
    const bar = createSelectorWithDependencies(foo, () => 'bar')
    const baz = createSelectorWithDependencies(bar, foo, () => 'bar')


    let registered = registerSelectors({ foo, bar })
    assert.equal(Object.keys(registered).length, 2)
    
    registered = registerSelectors({ baz })
    assert.equal(Object.keys(registered).length, 3)

    registered = registerSelectors({ baz })
    assert.equal(Object.keys(registered).length, 3)
  })
})

suite('checkSelector', () => {

  test('it outputs a selector\'s dependencies, even if it\'s a plain function', () => {
    const foo = () => 'foo'
    const bar = createSelectorWithDependencies(foo, () => 'bar')
    
    assert.equal(checkSelector(foo).dependencies.length, 0)

    assert.equal(checkSelector(bar).dependencies.length, 1)
    assert.equal(checkSelector(bar).dependencies[0], foo)
  })

  test('if you give it a way of getting state, it also gets inputs and outputs', () => {
    const state = { 
      foo: {
        baz: 1
      }
    }

    getStateWith(() => state)

    const foo = (state) => state.foo
    const bar = createSelectorWithDependencies(foo, (foo) => foo.baz)
    
    const checkedFoo = checkSelector(foo)
    assert.equal(checkedFoo.inputs.length, 0)
    assert.deepEqual(checkedFoo.output, { baz: 1 })
    assert.deepEqual(checkedFoo.output, foo(state))

    const checkedBar = checkSelector(bar)    
    assert.deepEqual(checkedBar.inputs, [ { baz: 1 } ])
    assert.equal(checkedBar.output, 1)
    assert.deepEqual(checkedBar.output, bar(state))

    getStateWith(null)
  })

  test('it returns the number of recomputations for a given selector', () => {
    const foo = (state) => state.foo
    const bar = createSelectorWithDependencies(foo, (foo) => foo.baz)
    assert.equal(bar.recomputations(), 0)

    const state = { 
      foo: {
        baz: 1
      }
    }
    getStateWith(() => state)

    bar(state)
    assert.equal(bar.recomputations(), 1)
    bar(state)

    assert.deepEqual(checkSelector(bar), {
      dependencies: [ foo ],
      inputs: [ { baz : 1 } ],
      output: 1,
      recomputations: 1
    })

    const newState = {
      foo: {
        baz: 2
      }
    }
    getStateWith(() => newState)

    bar(newState)
    assert.equal(bar.recomputations(), 2)

    bar(newState)
    assert.deepEqual(checkSelector(bar), {
      dependencies: [ foo ],
      inputs: [ { baz : 2 } ],
      output: 2,
      recomputations: 2
    })
  })

  test("it allows you to pass in a string name of a selector if you've registered", () => {
    const foo = (state) => state.foo
    const bar = createSelectorWithDependencies(foo, (foo) => foo + 1)
    registerSelectors({ bar })
    getStateWith(() => ({ foo: 1 }))
    const checked = checkSelector('bar')
    assert.deepEqual(checked, {
      dependencies: [ foo ],
      inputs: [ 1 ],
      output: 2,
      recomputations: 0
    })
  })
})

suite('selectorGraph', () => {
  function createMockSelectors() {
    const data$ = (state) => state.data
    const ui$ = (state) => state.ui
    const users$ = createSelectorWithDependencies(data$, (data) => data.users)
    const pets$ = createSelectorWithDependencies(data$, ({ pets }) => pets)
    const currentUser$ = createSelectorWithDependencies(ui$, users$, (ui, users) => users[ui.currentUser])
    const currentUserPets$ = createSelectorWithDependencies(currentUser$, pets$, (currentUser, pets) => currentUser.pets.map((petId) => pets[petId]))
    const random$ = () => 1
    const thingy$ = createSelectorWithDependencies(random$, (number) => number + 1)
    const booya$ = createSelectorWithDependencies(thingy$, currentUser$, () => 'booya!')
    return {
      data$,
      ui$,
      users$,
      pets$,
      currentUser$,
      currentUserPets$,
      random$,
      thingy$,
      booya$    
    }
  }

  test('it outputs a selector graph', () => {
    const selectors = createMockSelectors()
    const { edges, nodes } = selectorGraph()
    assert.equal(Object.keys(nodes).length, Object.keys(selectors).length)
    assert.equal(edges.length, 9)
  })

  test('it names the nodes based on their string name by default', () => {
    createMockSelectors()
    const { nodes } = selectorGraph()

    // comes from func.name for top-level vanilla selector functions.
    assert.equal(nodes['data$'].recomputations, 'N/A')
  })

  test("doesn't duplicate nodes if they are different", () => {
    const foo$ = (state) => state.foo // node1
    const select = () => 1
    createSelectorWithDependencies(foo$, select) // node 2
    createSelectorWithDependencies(select) // node 3
    const { nodes } = selectorGraph()
    assert.equal(Object.keys(nodes).length, 3)
  })

  test('it names the nodes based on entries in the registry if they are there', () => {
    const selectors = createMockSelectors()
    registerSelectors(selectors)
    const { edges } = selectorGraph()

    const expectedEdges = [ 
      { from: 'users$', to: 'data$' },
      { from: 'pets$', to: 'data$' },
      { from: 'currentUser$', to: 'ui$' },
      { from: 'currentUser$', to: 'users$' },
      { from: 'currentUserPets$', to: 'currentUser$' },
      { from: 'currentUserPets$', to: 'pets$' },
      { from: 'thingy$', to: 'random$' },
      { from: 'booya$', to: 'thingy$' },
      { from: 'booya$', to: 'currentUser$' }
    ]
    assert.sameDeepMembers(edges, expectedEdges)
  })
})
