var { checkSelector } = ReselectTools;


const cytoDefaults = {
  style: [ // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(id)'
      }
    },

    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle'
      }
    }
  ],

  layout: {
    name: 'dagre',
    rankDir: 'BT',
    ranker: 'longest-path',
  }
};


function drawCytoscapeGraph(graph) {
  const { nodes, edges } = graph;

  const cytoNodes = Object.keys(nodes).map((name) => ({
    data: Object.assign({}, nodes[name], {
      id: name
    })
  }));

  const findSelectorId = (selector) => {
    const node = cytoNodes.find(({ data }) => data.name === selector);
    return node.data.id;
  };

  const cytoEdges = edges.map((edge, i) => ({data: {
    source: findSelectorId(edge.from),
    target: findSelectorId(edge.to),
    id: i,
  }}));

  const elements = cytoNodes.concat(cytoEdges);

  const cy = cytoscape(Object.assign({}, cytoDefaults, {
    container: document.getElementById('root'), // container to render in
    elements,
  }));

  cy.nodes().on("click", function(x, ...args) {
    const data = this.data();
    console.log(data.name, checkSelector(data.name));
  });

}
