var { selectorGraph } = ReselectTools;
var { createSelector } = Reselect;

var STORE = {
  data: {
    users: {
      'bob': {
        id: 'bob',
        name: 'bob',
        age: 24,
        pets: ['fluffy', 'paws'],
      },
      'alice': {
        id: 'alice',
        name: 'alice',
        age: 22,
        pets: ['fluffy'],
      }
    },
    pets: {
      'fluffy': {
        name: 'fluffy',
      },
      'paws': {
        name: 'paws',
      }
    }
  },
  ui: {
    currentUser: 'alice',
  }
};

const ui$ = (state) => state.ui;
const users$ = (state) => state.data.users;
const pets$ = (state) => state.data.pets;
const currentUser$ = createSelector(ui$, users$, (ui, users) => users[ui.currentUser]);

const currentUserPets$ = createSelector(currentUser$, pets$, (currentUser, pets) => currentUser.pets.map((petId) => pets[petId]));
const currentUserAge$ = createSelector(currentUser$, (currentUser) => currentUser.age);

const random$ = (state) => 1;
const thingy$ = createSelector(random$, (number) => number + 1);

const selectors = {
  ui$,
  users$,
  pets$,
  currentUser$,
  currentUserPets$,
  currentUserAge$,
  random$,
  thingy$,
};

ReselectTools.registerSelectors(selectors);
ReselectTools.getStateWith(() => STORE);


drawCytoscapeGraph(selectorGraph());
update();

function update() {
  const currentUserDiv = document.getElementById('current-user');
  selectorGraph();
  currentUserDiv.innerHTML = `Current User: ${currentUser$(STORE).name}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const updateBobAge = () => {
    STORE = Object.assign({}, STORE, {
      data: Object.assign({}, STORE.data, {
        users: Object.assign({}, STORE.data.users, {
          bob: Object.assign({}, STORE.data.users.bob, {
            age: STORE.data.users.bob.age + 1
          })
        })
      })
    });

    update();
  };

  const updateAliceAge = () => {
    STORE = Object.assign({}, STORE, {
      data: Object.assign({}, STORE.data, {
        users: Object.assign({}, STORE.data.users, {
          alice: Object.assign({}, STORE.data.users.alice, {
            age: STORE.data.users.alice.age + 1
          })
        })
      })
    });

    update();
  };

  document.getElementById('incr-bob-age').addEventListener('click', updateBobAge);
  document.getElementById('incr-alice-age').addEventListener('click', updateAliceAge);
});
