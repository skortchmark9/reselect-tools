import JSONTree from 'react-json-tree';
import React, { PropTypes } from 'react';

const shouldExpandNode = (keyName, data, level) => level === 0;

const isObject = o => typeof o === 'object';

const valueStyle = {
  marginLeft: '0.875em',
  paddingLeft: '1.25em',
  paddingTop: '0.25em',
};

const StateTree = ({ data, style = {} }) => (
  <div style={style}>
    { isObject(data) ?
      <JSONTree
        data={data}
        shouldExpandNode={shouldExpandNode}
      / > : <div style={valueStyle}>{ "" + data }</div>
    }
  </div>
);

StateTree.propTypes = {
  data: PropTypes.any,
  style: PropTypes.object,
};

export default StateTree;
