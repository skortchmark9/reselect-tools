import React, { Component, PropTypes } from 'react';
import StateTree from './StateTree';
import style from './SelectorState.css';

const InputsSection = ({ zipped = [], onClickSelector }) => (
  <section className={style.section}>
    <h5>{zipped.length ? 'Inputs' : 'No Inputs'}</h5>
    <table style={{ width: '100%' }}>
      <tbody>
        { zipped.length ? zipped.map(([name, input], i) => (
          <tr className={style.tr} key={i}>
            <td>
              <a href="#" onClick={() => onClickSelector({ id: name })}>{name}</a>
            </td>
            <td><StateTree data={input} /></td>
          </tr>)) : null
        }
      </tbody>
    </table>
  </section>
);
InputsSection.propTypes = {
  zipped: PropTypes.array,
  onClickSelector: PropTypes.func
};

const OutputSection = ({ output }) => (
  <section>
    <h5>Output</h5>
    <StateTree data={output} />
  </section>
);
OutputSection.propTypes = { output: PropTypes.any };

export default class SelectorState extends Component {
  static propTypes = {
    checkedSelector: PropTypes.object,
    onClickSelector: PropTypes.func
  }
  render() {
    const { checkedSelector, onClickSelector } = this.props;
    const { zipped, output } = checkedSelector;
    return (
      <div style={{ overflowY: 'auto', flexGrow: 1 }}>
        <OutputSection output={output} />
        { zipped && <InputsSection zipped={zipped} onClickSelector={onClickSelector} /> }
      </div>
    );
  }
}
