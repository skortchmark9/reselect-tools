import React, { Component, PropTypes } from 'react';

import Search from './SelectorSearch';

const hStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  margin: 0,
  marginRight: '10px',
  flexWrap: 'nowrap',
  whiteSpace: 'nowrap',
};

const containerStyle = {
  flexShrink: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
  borderBottomWidth: '3px',
  borderBottomStyle: 'double',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  border: '1px solid rgb(79, 90, 101)',
  padding: '10px',
};

function SelectorInfo({ selector }) {
  const { recomputations, isNamed, name } = selector;

  const subheadStyle = { ...hStyle, color: 'rgb(111, 179, 210)' };
  let message = `(${recomputations} recomputations)`;
  if (recomputations === null) {
    message = '(not memoized)';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <h1 style={hStyle}>{name}</h1>
      <div style={{ flexShrink: 0 }}>
        <h5 style={subheadStyle}>{message}</h5>
        { !isNamed && <h5 style={subheadStyle}>(unregistered)</h5> }
      </div>
    </div>
  );
}
SelectorInfo.propTypes = { selector: PropTypes.object };

export default class SelectorInspector extends Component {
  static propTypes = {
    selector: PropTypes.object,
    selectors: PropTypes.object,
    onSelectorChosen: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      searching: false,
    };
    this.toggleSearch = this.toggleSearch.bind(this);
  }

  toggleSearch() {
    this.setState({ searching: !this.state.searching });
  }

  render() {
    const { selector, selectors, onSelectorChosen } = this.props;
    const { searching } = this.state;
    return (
      <div style={containerStyle}>
        { selector ? <SelectorInfo selector={selector} />
                   : <h1 style={hStyle}>Choose a selector</h1>
        }
        <Search
          searching={searching}
          onSelectorChosen={onSelectorChosen}
          onToggleSearch={this.toggleSearch}
          selectors={selectors}
        />
      </div>
    );
  }
}
