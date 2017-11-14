// Comes from JSON.stringify(selectorGraph());
const graph = {
  "edges": [
    {
      "from": "users$",
      "to": "data$"
    },
    {
      "from": "pets$",
      "to": "data$"
    },
    {
      "from": "currentUser$",
      "to": "ui$"
    },
    {
      "from": "currentUser$",
      "to": "users$"
    },
    {
      "from": "currentUserPets$",
      "to": "currentUser$"
    },
    {
      "from": "currentUserPets$",
      "to": "pets$"
    },
    {
      "from": "thingy$",
      "to": "random$"
    }
  ],
  "nodes": {
    "currentUser$": {
      "name": "currentUser$",
      "recomputations": 0
    },
    "currentUserPets$": {
      "name": "currentUserPets$",
      "recomputations": 0
    },
    "data$": {
      "name": "data$",
      "recomputations": "N/A"
    },
    "pets$": {
      "name": "pets$",
      "recomputations": 0
    },
    "random$": {
      "name": "random$",
      "recomputations": "N/A"
    },
    "thingy$": {
      "name": "thingy$",
      "recomputations": 0
    },
    "ui$": {
      "name": "ui$",
      "recomputations": "N/A"
    },
    "users$": {
      "name": "users$",
      "recomputations": 0
    }
  }
}

drawCytoscapeGraph(graph);