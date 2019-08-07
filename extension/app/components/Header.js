import React, { Component, PropTypes } from 'react';
import Button from 'remotedev-app/lib/components/Button';
import MdHelp from 'react-icons/lib/md/help';
import FindReplace from 'react-icons/lib/md/find-replace';
import Clear from 'react-icons/lib/md/clear';
import RefreshIcon from 'react-icons/lib/md/refresh';
import styles from 'remotedev-app/lib/styles';


const headerStyles = {
  refreshButton: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  select: {
    background: 'none',
    border: 'none',
    color: 'white',
    outline: 'none',
  },
  helpButton: {
    flexGrow: 0,
    maxWidth: '40px',
  },
};

class NumberButton extends Component {
  static propTypes = {
    defaultValue: PropTypes.number,
    onClick: PropTypes.func,
    numbers: PropTypes.array.isRequired,
  }
  constructor(props) {
    super(props);
    const value = props.defaultValue === undefined ? 1 : props.defaultValue;
    this.state = { value: value.toString() };
    this.onNumberChange = this.onNumberChange.bind(this);
    this.onClickWithNumber = this.onClickWithNumber.bind(this);
  }
  onNumberChange(e) {
    this.setState({ value: e.target.value.toString() });
    e.stopPropagation();
  }
  onClickWithNumber(e) {
    this.props.onClick(parseInt(this.state.value, 10));
  }
  stopPropagation(e) {
    e.stopPropagation();
  }
  render() {
    const { numbers, children, ...other } = this.props;
    const { value } = this.state;
    const options = numbers.map(n => <option value={n} key={n}>{n}</option>);

    return (
      <Button {...other} onClick={this.onClickWithNumber} >
        {children[0]}
        &nbsp;
        <select
          style={headerStyles.select}
          onClick={(e) => e.stopPropagation()}
          value={value}
          onChange={this.onNumberChange}
        >
          {options}
        </select>
        &nbsp;
        {children[1]}
      </Button>
    );
  }
}


export default function Header({ onRefresh, onResetRecomputations, onHelp, onPaintWorst }) {
  return (
    <header style={styles.buttonBar}>
      <Button
        style={headerStyles.refreshButton}
        Icon={RefreshIcon}
        onClick={onRefresh}
      >Refresh Selector Graph</Button>
      <Button
        Icon={Clear}
        onClick={onResetRecomputations}
      >Reset Recomputations</Button>
      <NumberButton
        Icon={FindReplace}
        onClick={onPaintWorst}
        numbers={[1, 2, 3, 5, 10]}
      >
        <span>Select</span>
        <span>Most Recomputed</span>
      </NumberButton>
      <Button
        style={headerStyles.helpButton}
        Icon={MdHelp}
        onClick={onHelp}
      />
    </header>
  );
}

Header.propTypes = {
  onRefresh: PropTypes.func,
  onHelp: PropTypes.func,
  onPaintWorst: PropTypes.func,
  onResetRecomputations: PropTypes.func,
};
