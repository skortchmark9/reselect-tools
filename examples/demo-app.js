var { createSelectorWithDependencies, selectorGraph } = ReselectTools;
ReselectTools.getStateWith(() => STORE);

var STORE = {
  data: {
    users: {
      '1': {
        id: '1',
        name: 'bob',
        pets: ['a', 'b'],
      },
      '2': {
        id: '2',
        name: 'alice',
        pets: ['a'],
      }
    },
    pets: {
      'a': {
        name: 'fluffy',
      },
      'b': {
        name: 'paws',
      }
    }
  },
  ui: {
    currentUser: '1',
  }
};

const data$ = (state) => state.data;
const ui$ = (state) => state.ui;
var users$ = createSelectorWithDependencies(data$, (data) => data.users);
var pets$ = createSelectorWithDependencies(data$, ({ pets }) => pets);
var currentUser$ = createSelectorWithDependencies(ui$, users$, (ui, users) => users[ui.currentUser]);

var currentUserPets$ = createSelectorWithDependencies(currentUser$, pets$, (currentUser, pets) => currentUser.pets.map((petId) => pets[petId]));

const random$ = (state) => 1;
const thingy$ = createSelectorWithDependencies(random$, (number) => number + 1);

const selectors = {
  data$,
  ui$,
  users$,
  pets$,
  currentUser$,
  currentUserPets$,
  random$,
  thingy$,
};

ReselectTools.registerSelectors(selectors);


drawCytoscapeGraph(selectorGraph());