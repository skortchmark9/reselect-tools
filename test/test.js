import chai from 'chai'
import { createSelector } from 'reselect'
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
    const baz = createSelectorWithDependencies(bar, foo, () => 'baz')
    registerSelectors({ foo, bar, bazinga: baz })

    assert.equal(foo.selectorName, 'foo')
    assert.equal(bar.selectorName, 'bar')
    assert.equal(baz.selectorName, 'bazinga')
  })

  test('ignores inputs which are not selectors or functions', () => {
    const foo = () => 'foo'
    const bar = createSelectorWithDependencies(foo, () => 'bar')
    const utilities = {
      identity: x => x
    }
    const selectors = { foo, bar, utilities }
    registerSelectors(selectors)

    assert.isUndefined(utilities.selectorName)
  })

  test('can be called additively', () => {
    const foo = () => 'foo'
    const bar = createSelectorWithDependencies(foo, () => 'bar')
    const baz = createSelectorWithDependencies(bar, foo, () => 'bar')

    registerSelectors({ foo, bar })
    assert.equal(foo.selectorName, 'foo')

    registerSelectors({ baz })
    registerSelectors({ hat: foo })
    assert.equal(foo.selectorName, 'hat')
    assert.equal(bar.selectorName, 'bar')
    assert.equal(baz.selectorName, 'baz')
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
      recomputations: 1,
      isNamed: false,
      selectorName: null
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
      recomputations: 2,
      isNamed: false,
      selectorName: null
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
      recomputations: 0,
      isNamed: true,
      selectorName: 'bar'
    })
  })

  test('it throws if you try to check a non-existent selector', () => {
    const foo = (state) => state.foo
    const bar = createSelectorWithDependencies(foo, (foo) => foo + 1)
    registerSelectors({ bar })
    assert.throws(() => checkSelector('baz'))
  })

  test('it throws if you try to check a non-function', () => {
    assert.throws(() => checkSelector(1))
  })

  test('it tells you whether or not a selector has been registered', () => {
    const one$ = () => 1
    const two$ = createSelectorWithDependencies(one$, (one) => one + 1)
    registerSelectors({ one$ })

    assert.equal(checkSelector(() => 1).isNamed, false)

    assert.equal(checkSelector(two$).isNamed, false)
    registerSelectors({ two$ })
    assert.equal(checkSelector(two$).isNamed, true)
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

  test('allows you to pass in a different selector key function', () => {
    function idxSelectorKey(selector) {
      return selector.idx
    }

    const selectors = createMockSelectors()
    Object.keys(selectors).sort().forEach((key, i) => {
      const selector = selectors[key]
      selector.idx = i
    })

    const { nodes } = selectorGraph(idxSelectorKey)
    assert.equal(Object.keys(nodes).length, 9)
  })

  test("It doesn't duplicate work for a given selector", () => {
    // this test is pretty bad and very tied to the implementation because I 
    // didn't want to pull in a spy / mock framework yet.
    let calls = 0
    const badSelectorKey = () => {
      calls += 1
      return 'key'
    }
    const selectors = createMockSelectors()

    const numSelectorsWithDependencies = Object.keys(selectors).reduce((sum, key) => {
      return sum + (selectors[key].dependencies === undefined ? 0 : 1)
    }, 0)

    const { nodes, edges } = selectorGraph(badSelectorKey)

    assert.equal(Object.keys(nodes).length, 1)

    // It gets called once for each tracked selector
    // Since it always returns the same key, it only does work for one of them
    // For that one, it goes down to the dependencies, and calls selectorKey
    // twice for each one.
    assert.equal(calls, numSelectorsWithDependencies + edges.length * 2)
  })


  suite('defaultSelectorKey', () => {
    test('it names the nodes based on their string name by default', () => {
      createMockSelectors()
      const { nodes } = selectorGraph()

      // comes from func.name for top-level vanilla selector functions.
      assert.equal(nodes['data$'].recomputations, null)
    })

    test('it falls back to toString on anonymous functions', () => {
      createSelectorWithDependencies(() => 1, (one) => one + 1)
      const { nodes } = selectorGraph()
      const keys = Object.keys(nodes)
      assert.equal(keys.length, 2)
      for (let key of keys) {
        assert.include(key, '1')
      }
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

    test('it interops with regular reselect selectors', () => {
      const foo$ = (state) => state.foo
      const bar$ = createSelector(foo$, (foo) => foo + 1)
      createSelectorWithDependencies(foo$, bar$, (foo, bar) => foo + bar)
      const { nodes , edges } = selectorGraph()
      assert.equal(Object.keys(nodes).length, 3)
      assert.equal(Object.keys(edges).length, 2)
    })
  })
})
