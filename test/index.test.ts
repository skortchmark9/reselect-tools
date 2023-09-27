import { createSelector } from 'reselect'
import {
  checkSelector,
  createSelectorWithDependencies,
  getStateWith,
  registerSelectors,
  reset,
  selectorGraph
} from '../src/index'

import { assert } from 'chai'
import type {
  RegisteredSelector,
  ResultSelector,
  SelectorsObject
} from 'src/types'
import { beforeEach, expect, suite, test } from 'vitest'

beforeEach(reset)

suite('registerSelectors', () => {
  test('allows you to name selectors', () => {
    const foo = (() => 'foo') as unknown as RegisteredSelector
    const bar = createSelector(
      foo,
      () => 'bar'
    ) as unknown as RegisteredSelector
    const baz = createSelector(
      bar,
      foo,
      () => 'baz'
    ) as unknown as RegisteredSelector
    registerSelectors({ foo, bar, bazinga: baz })
    // assert.equal(foo.selectorName, 'foo')
    // assert.equal(bar.selectorName, 'bar')
    // assert.equal(baz.selectorName, 'bazinga')
    expect(foo.selectorName).equal('foo')
    expect(bar.selectorName).equal('bar')
    expect(baz.selectorName).equal('bazinga')
  })

  test('ignores inputs which are not selectors or functions', () => {
    const foo = () => 'foo'
    const bar = createSelector(foo, () => 'bar')
    const utilities = {
      identity: (x: unknown) => x
    } as unknown as RegisteredSelector
    const selectors = { foo, bar, utilities }
    registerSelectors(selectors)

    expect(utilities.selectorName).toBeUndefined()
    // assert.isUndefined(utilities.selectorName)
  })

  test('ignores inputs which are null', () => {
    const foo = () => 'foo'
    const bar = createSelector(foo, () => 'bar')
    const selectors = { foo, bar, property: null } as unknown as SelectorsObject
    registerSelectors(selectors)
  })

  test('can be called additively', () => {
    const foo = (() => 'foo') as RegisteredSelector
    const bar = createSelector(foo, () => 'bar') as RegisteredSelector
    const baz = createSelector(bar, foo, () => 'bar') as RegisteredSelector

    registerSelectors({ foo, bar })
    expect(foo.selectorName).equal('foo')
    // assert.equal(foo.selectorName, 'foo')

    registerSelectors({ baz })
    registerSelectors({ hat: foo })
    expect(foo.selectorName).equal('hat')
    expect(bar.selectorName).equal('bar')
    expect(baz.selectorName).equal('baz')
    // assert.equal(foo.selectorName, 'hat')
    // assert.equal(bar.selectorName, 'bar')
    // assert.equal(baz.selectorName, 'baz')
  })
})

suite('createSelectorWithDependencies', () => {
  test('it is just exported for legacy purposes', () => {
    const four = () => 4
    let calls1 = 0
    let calls2 = 0
    const selector1 = createSelector(four, () => calls1++)
    // @ts-expect-error
    const selector2 = createSelectorWithDependencies(four, () => calls2++)
    // @ts-expect-error
    selector1()
    // @ts-expect-error
    selector1()
    // @ts-expect-error
    selector2()
    // @ts-expect-error
    selector2()
    expect(calls1).equal(calls2)
    // assert.equal(calls1, calls2)
  })
})

suite('checkSelector', () => {
  test("it outputs a selector's dependencies, even if it's a plain function", () => {
    const foo = () => 'foo'
    const bar = createSelector(foo, () => 'bar')

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

    const foo = (s: typeof state) => s.foo
    const bar = createSelector(foo, foo => foo.baz)

    const checkedFoo = checkSelector(foo)
    expect(checkedFoo.inputs?.length).equal(0)
    expect(checkedFoo.output).toStrictEqual({ baz: 1 })
    expect(checkedFoo.output).toStrictEqual(foo(state))
    // assert.equal(checkedFoo.inputs.length, 0)
    // assert.deepEqual(checkedFoo.output, { baz: 1 })
    // assert.deepEqual(checkedFoo.output, foo(state))

    const checkedBar = checkSelector(bar)
    expect(checkedBar.inputs).toStrictEqual([{ baz: 1 }])
    expect(checkedBar.output).equal(1)
    expect(checkedBar.output).toStrictEqual(bar(state))
    // assert.deepEqual(checkedBar.inputs, [{ baz: 1 }])
    // assert.equal(checkedBar.output, 1)
    // assert.deepEqual(checkedBar.output, bar(state))

    getStateWith(null)
  })

  test('it returns the number of recomputations for a given selector', () => {
    interface State {
      foo: {
        baz: number
      }
    }
    const foo = (state: State) => state.foo
    const bar = createSelector(foo, foo => foo.baz)
    expect(bar.recomputations()).equal(0)
    // assert.equal(bar.recomputations(), 0)

    const state: State = {
      foo: {
        baz: 1
      }
    }
    getStateWith(() => state)

    bar(state)
    expect(bar.recomputations()).equal(1)
    // assert.equal(bar.recomputations(), 1)
    bar(state)

    expect(checkSelector(bar)).toStrictEqual({
      dependencies: [foo],
      inputs: [{ baz: 1 }],
      output: 1,
      recomputations: 1,
      isNamed: false,
      selectorName: null
    })
    // assert.deepEqual(checkSelector(bar), {
    //   dependencies: [foo],
    //   inputs: [{ baz: 1 }],
    //   output: 1,
    //   recomputations: 1,
    //   isNamed: false,
    //   selectorName: null
    // })

    const newState = {
      foo: {
        baz: 2
      }
    }
    getStateWith(() => newState)

    bar(newState)
    expect(bar.recomputations()).equal(2)
    // assert.equal(bar.recomputations(), 2)

    bar(newState)
    expect(checkSelector(bar)).toStrictEqual({
      dependencies: [foo],
      inputs: [{ baz: 2 }],
      output: 2,
      recomputations: 2,
      isNamed: false,
      selectorName: null
    })
    // assert.deepEqual(checkSelector(bar), {
    //   dependencies: [foo],
    //   inputs: [{ baz: 2 }],
    //   output: 2,
    //   recomputations: 2,
    //   isNamed: false,
    //   selectorName: null
    // })
  })

  test("it allows you to pass in a string name of a selector if you've registered", () => {
    interface State {
      foo: number
    }
    const foo = (state: State) => state.foo
    const bar = createSelector(foo, foo => foo + 1)
    registerSelectors({ bar })
    getStateWith(() => ({ foo: 1 }))
    // @ts-expect-error
    const checked = checkSelector('bar')
    expect(checked).toStrictEqual({
      dependencies: [foo],
      inputs: [1],
      output: 2,
      recomputations: 0,
      isNamed: true,
      selectorName: 'bar'
    })
    // assert.deepEqual(checked, {
    //   dependencies: [foo],
    //   inputs: [1],
    //   output: 2,
    //   recomputations: 0,
    //   isNamed: true,
    //   selectorName: 'bar'
    // })
  })

  test('it throws if you try to check a non-existent selector', () => {
    interface State {
      foo: number
    }
    const foo = (state: State) => state.foo
    const bar = createSelector(foo, foo => foo + 1)
    registerSelectors({ bar })
    // @ts-expect-error
    expect(() => checkSelector('baz')).throws()
    // assert.throws(() => checkSelector('baz'))
  })

  test('it throws if you try to check a non-function', () => {
    // @ts-expect-error
    expect(() => checkSelector(1)).throws()
    // assert.throws(() => checkSelector(1))
  })

  test('it tells you whether or not a selector has been registered', () => {
    const one$ = () => 1
    const two$ = createSelector(one$, one => one + 1)
    registerSelectors({ one$ })

    expect(checkSelector(() => 1).isNamed).equal(false)
    // assert.equal(checkSelector(() => 1).isNamed, false)

    expect(checkSelector(two$).isNamed).equal(false)
    // assert.equal(checkSelector(two$).isNamed, false)
    registerSelectors({ two$ })
    expect(checkSelector(two$).isNamed).equal(true)
    // assert.equal(checkSelector(two$).isNamed, true)
  })

  test('it catches errors inside parent selector functions and exposes them', () => {
    interface State {
      foo: {
        bar: number
      }
    }
    const badParentSelector$ = (state: State) => state.foo.bar
    const badSelector$ = createSelector(badParentSelector$, foo => foo)
    getStateWith(() => [])
    registerSelectors({ badSelector$ })

    // @ts-expect-error
    const checked = checkSelector('badSelector$')
    expect(checked.error).equal(
      'checkSelector: error getting inputs of selector badSelector$. The error was:\n' +
        "Cannot read properties of undefined (reading 'bar')"
    )
    // assert.equal(
    //   checked.error,
    //   'checkSelector: error getting inputs of selector badSelector$. The error was:\n' +
    //     "TypeError: Cannot read property 'bar' of undefined"
    // )
  })

  test('it catches errors inside selector functions and exposes them', () => {
    interface State {
      foo: {
        bar: number
      }
    }
    const badSelector$ = (state: State) => state.foo.bar
    getStateWith(() => [])
    registerSelectors({ badSelector$ })

    // @ts-expect-error
    const checked = checkSelector('badSelector$')
    expect(checked.error).equal(
      'checkSelector: error getting output of selector badSelector$. The error was:\n' +
        "Cannot read properties of undefined (reading 'bar')"
    )
    // assert.equal(
    //   checked.error,
    //   'checkSelector: error getting output of selector badSelector$. The error was:\n' +
    //     "TypeError: Cannot read property 'bar' of undefined"
    // )
  })
})

suite('selectorGraph', () => {
  interface State {
    data: {
      users: [{ pets: number[] }]
      pets: number[]
    }
    ui: {
      currentUser: number
    }
  }
  function createMockSelectors() {
    const data$ = (state: State) => state.data
    const ui$ = (state: State) => state.ui
    const users$ = createSelector(data$, data => data.users)
    const pets$ = createSelector(data$, ({ pets }) => pets)
    const currentUser$ = createSelector(
      ui$,
      users$,
      (ui, users) => users[ui.currentUser]
    )
    const currentUserPets$ = createSelector(
      currentUser$,
      pets$,
      (currentUser, pets) => currentUser!.pets.map(petId => pets[petId]!)
    )
    const random$ = () => 1
    const thingy$ = createSelector(random$, number => number + 1)
    const booya$ = createSelector(thingy$, currentUser$, () => 'booya!')
    const selectors = {
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
    // @ts-expect-error
    registerSelectors(selectors)
    return selectors
  }

  test('returns an empty graph if no selectors are registered', () => {
    const { edges, nodes } = selectorGraph()
    expect(Object.keys(nodes).length).equal(0)
    expect(edges.length).equal(0)
    // assert.equal(Object.keys(nodes).length, 0)
    // assert.equal(edges.length, 0)
  })

  test('walks up the tree if you register a single selector', () => {
    function parent() {
      return 'parent'
    }
    const child$ = createSelector(parent, string => string)
    registerSelectors({ child$ })
    const { edges, nodes } = selectorGraph()
    expect(Object.keys(nodes).length).equal(2)
    expect(edges.length).equal(1)
    // assert.equal(Object.keys(nodes).length, 2)
    // assert.equal(edges.length, 1)
  })

  test('it outputs a selector graph', () => {
    const selectors = createMockSelectors()

    const { edges, nodes } = selectorGraph()
    expect(Object.keys(nodes).length).equal(Object.keys(selectors).length)
    expect(edges.length).equal(9)
    // assert.equal(Object.keys(nodes).length, Object.keys(selectors).length)
    // assert.equal(edges.length, 9)
  })

  test('allows you to pass in a different selector key function', () => {
    type DummySelector = ResultSelector & { idx: number }
    function idxSelectorKey(selector: DummySelector) {
      return selector.idx
    }

    const selectors = createMockSelectors()
    type Keys = (keyof typeof selectors)[]
    ;(Object.keys(selectors) as Keys).sort().forEach((key, i) => {
      const selector = selectors[key]
      // @ts-expect-error
      selector.idx = i
    })

    // @ts-expect-error
    const { nodes } = selectorGraph(idxSelectorKey)
    expect(Object.keys(nodes).length).equal(9)
    // assert.equal(Object.keys(nodes).length, 9)
  })

  suite('defaultSelectorKey', () => {
    test('it names the nodes based on their string name by default', () => {
      createMockSelectors()
      const { nodes } = selectorGraph()

      // comes from func.name for top-level vanilla selector functions.
      expect(nodes['data$']?.recomputations).equal(null)
      // assert.equal(nodes['data$'].recomputations, null)
    })

    test('it falls back to toString on anonymous functions', () => {
      const selector1 = createSelector(
        () => 1,
        one => one + 1
      )
      registerSelectors({ selector1 })
      const { nodes } = selectorGraph()
      const keys = Object.keys(nodes)
      expect(keys.length).equal(2)
      // assert.equal(keys.length, 2)

      // [ 'selector1', 'function () {\n        return 1;\n      }' ]
      for (const key of keys) {
        expect(key).include('1')
        // assert.include(key, '1')
      }
    })

    test('it creates numeric names for unregistered selectors', () => {
      const foo$ = createSelector(() => 'foo')
      // @ts-expect-error
      const unregistered$ = createSelector(foo$, () => 1)
      const registered$ = createSelector(unregistered$, () => 3)

      // @ts-expect-error
      registerSelectors({ registered$, foo$ })
      const { nodes } = selectorGraph()
      const keys = Object.keys(nodes)
      expect(keys.length).equal(3)
      // assert.equal(keys.length, 3)

      // please let's do better!
      // assert.isDefined(nodes['function () {\n        return 1;\n      }22074'])
      // Replace with:
      assert.isDefined(nodes['memoized']) // In reselect v5.0.0-alpha.2 the anonymous function has been given the name `memoized`.
      // expect(
      //   nodes['function () {\n        return 1;\n      }22074']
      // ).toBeDefined()
    })

    test("doesn't duplicate nodes if they are different", () => {
      interface State {
        foo: number
      }
      const foo$ = (state: State) => state.foo // node1
      const select = () => 1 // node 2
      createSelector(foo$, select)
      createSelector(select) // node 3
      registerSelectors({ foo$, baz: select })
      const { nodes } = selectorGraph()
      expect(Object.keys(nodes).length).equal(2)
      // assert.equal(Object.keys(nodes).length, 2)
    })

    test('it names the nodes based on entries in the registry if they are there', () => {
      createMockSelectors()
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
      expect(edges).deep.members(expectedEdges)
      // assert.sameDeepMembers(edges, expectedEdges)
    })
  })
})
