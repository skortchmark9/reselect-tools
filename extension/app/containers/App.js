import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import styles from 'remotedev-app/lib/styles';
import enhance from 'remotedev-app/lib/hoc';

import SelectorInspector from '../components/SelectorInspector';
import SelectorState from '../components/SelectorState';
import SelectorGraph from '../components/SelectorGraph';
import Dock from '../components/Dock';
import Header from '../components/Header';

import * as SelectorActions from '../actions/graph';


const contentStyles = {
  content: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  graph: {
    border: '1px solid rgb(79, 90, 101)',
    position: 'relative',
    height: '100%',
    minHeight: 0,
  },
  recomputations: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    margin: 0,
    padding: '1em',
  }
};


function renderMessage(message) {
  const centerText = { margin: 'auto' };
  return (
    <div style={contentStyles.content}>
      <h1 style={centerText}>{message}</h1>
    </div>
  );
}


function openGitRepo() {
  const url = 'https://github.com/skortchmark9/reselect-devtools-extension';
  window.open(url, '_blank');
}

const checkedSelector$ = (state) => {
  const { checkedSelectorId, nodes, edges } = state.graph;
  const selector = nodes[checkedSelectorId];
  if (!selector) return;

  // this is a bit ugly because it relies on edges being in order.
  const dependencies = edges.filter(edge => edge.from === checkedSelectorId);
  const dependencyIds = dependencies.map(edge => edge.to);

  if (!selector.inputs) {
    return selector;
  }

  const { inputs } = selector;
  if (dependencyIds.length !== inputs.length) {
    console.error(`Uh oh, inputs and edges out of sync on ${checkedSelectorId}`);
  }

  const zipped = [];
  for (let i = 0; i < dependencyIds.length; i++) {
    zipped.push([dependencyIds[i], inputs[i]]);
  }
  return { ...selector, zipped };
};


const RecomputationsTotal = ({ nodes }) => {
  const nodeArr = Object.keys(nodes).map(k => nodes[k]);
  const total = nodeArr.reduce((acc, node) => acc + node.recomputations, 0);
  return <h2 style={contentStyles.recomputations}>{total} Recomputations</h2>;
};

@connect(
  state => ({
    graph: state.graph,
    checkedSelector: checkedSelector$(state),
  }),
  dispatch => ({
    actions: bindActionCreators(SelectorActions, dispatch)
  })
)
@enhance
export default class App extends Component {
  static propTypes = {
    actions: PropTypes.object.isRequired,
    graph: PropTypes.object,
    checkedSelector: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      dockIsOpen: true,
    };
    this.handleCheckSelector = this.handleCheckSelector.bind(this);
    this.refreshGraph = this.refreshGraph.bind(this);
    this.toggleDock = this.toggleDock.bind(this);
    this.paintNWorst = this.paintNWorst.bind(this);
  }

  componentDidMount() {
    this.refreshGraph();
  }

  refreshGraph() {
    this.sg && this.sg.reset();
    this.resetSelectorData();
    this.props.actions.getSelectorGraph();
  }

  paintNWorst(n) {
    this.resetSelectorData();
    this.sg.highlightNMostRecomputed(n);
  }

  resetSelectorData() {
    this.props.actions.uncheckSelector();
  }

  toggleDock() {
    this.setState({
      dockIsOpen: !this.state.dockIsOpen,
    });
  }

  handleCheckSelector(selectorToCheck) {
    this.props.actions.checkSelector(selectorToCheck);
  }

  renderGraph(graph) {
    const { checkedSelector } = this.props;
    const { dockIsOpen } = this.state;

    const dockMessage = (!checkedSelector || checkedSelector.isNamed) ?
                        'checkSelector output' : 'name selector to get data';

    return (
      <div style={contentStyles.content}>
        <SelectorInspector
          onSelectorChosen={this.handleCheckSelector}
          selector={checkedSelector}
          selectors={graph.nodes}
        />
        <div style={contentStyles.graph}>
          <Dock
            isOpen={dockIsOpen}
            toggleDock={this.toggleDock}
            message={dockMessage}
          >
            { checkedSelector ?
              <SelectorState
                checkedSelector={checkedSelector}
                onClickSelector={this.handleCheckSelector} /> :
              <span>No Data</span>
            }
          </Dock>
          <RecomputationsTotal {...graph} />
          <SelectorGraph
            checkSelector={this.handleCheckSelector}
            selector={checkedSelector}
            ref={sg => this.sg = sg}
            {...graph}
          />
        </div>
      </div>
    );
  }

  renderContent() {
    const { graph } = this.props;
    if (graph.fetchedSuccessfully) return this.renderGraph(graph);
    if (graph.fetching) return renderMessage('Loading...');
    return renderMessage('Could not load selector graph');
  }

  render() {
    return (
      <div style={styles.container}>
        <Header
          onRefresh={this.refreshGraph}
          onHelp={openGitRepo}
          onPaintWorst={this.paintNWorst}
        />
        { this.renderContent() }
      </div>
    );
  }
}

