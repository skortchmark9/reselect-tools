import React, { Component, PropTypes } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

const truncateText = (str, maxChars = 20) => (str.length > maxChars ? str.slice(0, maxChars) : str);
const labelText = (id, recomputations) => truncateText(id) + (recomputations === null ? '' : ` (${recomputations})`);


const colors = {
  defaultEdge: 'rgb(79, 90, 101)',
  defaultNodeLabel: 'rgb(111, 179, 210)',
  defaultNode: 'rgb(232, 234, 246)',
  selectedNode: 'orange',
  dependency: '#ffeb3b',
  dependent: '#f868d0',
  recomputed: 'red',
};

const defaultEdgeStyle = {
  'curve-style': 'bezier',
  width: 4,
  'target-arrow-shape': 'triangle',
  'line-color': colors.defaultEdge,
  'target-arrow-color': colors.defaultEdge,
  'z-index': 1,
};

const selectedNodeStyle = {
  'background-color': colors.selectedNode
};

const defaultNodeStyle = {
  label: 'data(label)',
  color: colors.defaultNodeLabel,
  'background-color': colors.defaultNode,
};

const Y_SPACING = 0.1;

const cytoDefaults = {
  style: [
    {
      selector: 'edge',
      style: defaultEdgeStyle
    },
    {
      selector: 'node',
      style: defaultNodeStyle
    }
  ],
  layout: {
    name: 'dagre',
    rankDir: 'BT',
    // fit: false,
    ranker: 'longest-path',
    // padding: 0,
    nodeDimensionsIncludeLabels: false, // this doesn't really work alas
    transform: (node, { x, y }) => {
      // increase distance between y ranks, and offset some nodes
      // a bit up and down so labels don't collide.
      const offsetDirection = Math.random() > 0.5 ? 1 : -1;
      const offset = y * Y_SPACING;
      return { x, y: y + offset + (offset * offsetDirection) };
    }
  }
};

function createCytoElements(nodes, edges) {
  const cytoNodes = Object.keys(nodes).map(name => ({
    data: Object.assign({}, nodes[name], {
      id: name,
      label: labelText(name, nodes[name].recomputations)
    }),
  }));


  const cytoEdges = edges.map((edge, i) => ({ data: {
    source: edge.from,
    target: edge.to,
    id: i,
  } }));

  return cytoNodes.concat(cytoEdges);
}


export function drawCytoscapeGraph(container, nodes, edges) {
  const elements = createCytoElements(nodes, edges);
  return cytoscape({ ...cytoDefaults, container, elements });
}

function paintDependencies(elts) {
  elts.forEach((elt) => {
    if (elt.isNode()) {
      elt.style({
        'background-color': colors.dependency,
      });
    } else if (elt.isEdge()) {
      elt.style({
        'line-color': colors.dependency,
        'z-index': 99,
        'target-arrow-color': colors.dependency,
      });
    }
  });
}

function paintDependents(elts) {
  elts.forEach((elt) => {
    if (elt.isNode()) {
      elt.style({
        'background-color': colors.dependent,
      });
    } else if (elt.isEdge()) {
      elt.style({
        'line-color': colors.dependent,
        'z-index': 99,
        'target-arrow-color': colors.dependent,
      });
    }
  });
}


const circleStyle = {
  borderRadius: '50%',
  width: '1em',
  height: '1em',
  display: 'inline-block',
  margin: '0 0.5em',
  marginTop: '0.2em'
};
const Circle = ({ color }) => <div style={{ ...circleStyle, background: color }} />;
const LegendItem = ({ name, color }) => (
  <div style={{display: 'flex', alignItems: 'center', margin: '0.5em' }}>
    <Circle color={color} /><span>{name}</span>
  </div>
);


export default class SelectorGraph extends Component {
  static propTypes = {
    nodes: PropTypes.object.isRequired,
    edges: PropTypes.array.isRequired,
    checkSelector: PropTypes.func,
    selector: PropTypes.object,
  };

  componentDidMount() {
    this.cy = drawCytoscapeGraph(this.cyElement, this.props.nodes, this.props.edges);
    const pan = this.cy.pan();
    const height = this.cy.height();
    this.cy.pan({ ...pan, y: height / 3 });
    this.bindEvents();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.nodes !== this.props.nodes || nextProps.edges !== this.props.edges) {
      const { nodes, edges } = nextProps;
      const elements = createCytoElements(nodes, edges);
      this.cy.json({ elements });
    }

    if (nextProps.selector && nextProps.selector !== this.props.selector) {
      this.paintNodeSelection(nextProps.selector);
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    if (this.cy) this.cy.destroy();
  }

  reset() {
    const { label, ...nodeStyle } = defaultNodeStyle; // eslint-disable-line no-unused-vars
    this.cy.nodes().style(nodeStyle);
    this.cy.edges().style(defaultEdgeStyle);
  }

  paintNodeSelection(selector) {
    this.reset();
    if (!selector || !selector.id) return;

    // can't search with selectors because special chars, i.e. $ interfere
    const selectedNode = this.cy.nodes(node => node.data().id === selector.id);
    selectedNode.style(selectedNodeStyle);
    paintDependencies(selectedNode.successors());
    paintDependents(selectedNode.predecessors());
  }

  highlightNMostRecomputed(n = 1) {
    this.reset();
    const nodes = this.cy.nodes();
    const recomputationBuckets = new Map(); // bucketzzz
    nodes.forEach((node) => {
      const recomputations = node.data().recomputations;
      if (!recomputationBuckets.get(recomputations)) {
        recomputationBuckets.set(recomputations, []);
      }
      recomputationBuckets.get(recomputations).push(node);
    });
    const mostRecomputed = [...recomputationBuckets.keys()].sort((x, y) => x - y);
    const nMost = mostRecomputed.slice(-n);
    const highlighted = nMost.reduce((acc, key) => acc.concat(recomputationBuckets.get(key)), []);
    highlighted.forEach(node => node.style({
      'background-color': colors.recomputed,
    }));
  }

  bindEvents() {
    const { checkSelector } = this.props;
    function clickHandler() {
      const data = this.data();
      checkSelector(data);
    }
    if (checkSelector) {
      this.cy.on('tap', 'node', clickHandler);
    }
  }

  render() {
    const legendStyle = {
      position: 'absolute',
      top: 0,
      right: 0,
      zIndex: 100,
    };
    return (
      <div style={{ height: '100%' }} ref={(e) => { this.cyElement = e; }}>
        <div style={legendStyle}>
          <LegendItem name="dependency" color={colors.dependency} />
          <LegendItem name="selected" color={colors.selectedNode} />
          <LegendItem name="dependent" color={colors.dependent} />
          <LegendItem name="recomputed" color={colors.recomputed} />
        </div>
      </div>
    );
  }
}
