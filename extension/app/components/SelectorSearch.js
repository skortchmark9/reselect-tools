import React, { Component, PropTypes } from 'react';
import Autocomplete from 'react-autocomplete';
import Button from 'remotedev-app/lib/components/Button';
import MdSearch from 'react-icons/lib/md/search';

import style from './SelectorSearch.css';

const itemStyle = isHighlighted => ({
  padding: '1em',
  background: isHighlighted ? 'rgb(79, 90, 101)' : 'rgb(0, 43, 55)',
  borderBottom: '1px solid rgb(79, 90, 101)'
});

const renderItem = (item, isHighlighted) => (
  <div style={itemStyle(isHighlighted)}>
    {item.id}
  </div>
);

const getItemValue = item => item.id;

export default class Search extends Component {
  static propTypes = {
    searching: PropTypes.bool,
    onToggleSearch: PropTypes.func.isRequired,
    selectors: PropTypes.object.isRequired,
    onSelectorChosen: PropTypes.func.isRequired,
  }
  constructor(props) {
    super(props);
    this.state = { value: '' };
    this.onInput = this.onInput.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.searching && !nextProps.searching) {
      this.setState({ value: '' });
    }
  }
  onInput(e) {
    this.setState({ value: e.target.value });
  }
  onSelect(id) {
    this.setState({ value: id });
    const { selectors, onSelectorChosen } = this.props;
    onSelectorChosen(selectors[id]);
  }
  render() {
    const { searching, onToggleSearch, selectors } = this.props;
    const { value } = this.state;
    const items = Object.keys(selectors).map(key => selectors[key]);
    const autocompleteProps = {
      className: style.autocomplete,
      style: {} // disable default inline styles
    };

    const suggestionContainerStyles = {
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
      fontSize: '90%',
      position: 'fixed',
      overflow: 'auto',
      maxHeight: '50%',
    };

    return (
      <div className={style.searchContainer}>
        {searching && <Autocomplete
          wrapperProps={autocompleteProps}
          inputProps={{ autoFocus: true }}
          placeholder="search here"
          items={items}
          menuStyle={suggestionContainerStyles}
          shouldItemRender={(item, val) => item.id.toLowerCase().indexOf(val.toLowerCase()) > -1}
          getItemValue={getItemValue}
          renderItem={renderItem}
          onChange={this.onInput}
          onSelect={this.onSelect}
          value={value}
        />
        }
        <Button onClick={onToggleSearch} Icon={MdSearch}>
          Search
        </Button>
      </div>
    );
  }
}
