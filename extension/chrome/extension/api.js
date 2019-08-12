function evalPromise(str) {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(str, (resultStr, err) => {
      const result = JSON.parse(resultStr);
      if (err && err.isException) {
        console.error(err.value);
        reject(err.value);
      } else {
        resolve(result);
      }
    });
  });
}

async function execute(strings, ...keys) {
  const lastIndex = strings.length - 1;
  const vanilla = strings
    .slice(0, lastIndex)
    .reduce((p, s, i) => p + s + keys[i], '')
    + strings[lastIndex];

  return evalPromise(`(function() {${vanilla}})()`);
}


export async function checkSelector(id) {
  return execute`
    const __reselect_last_check = window.__RESELECT_TOOLS__.checkSelector('${id}');
    console.log(__reselect_last_check);
    return JSON.stringify(__reselect_last_check);
  `;
}

export async function selectorGraph(resetRecomputations) {
  let resetStr = '';
  if (resetRecomputations) {
    const expr = `
    for (const selector of new Set(Object.values(window.__RESELECT_TOOLS__.selectorGraph().nodes))) {
      selector.resetRecomputations && selector.resetRecomputations();
    };
    `;
    resetStr = expr;
  }
  return execute`
    ${resetStr}
    return JSON.stringify(window.__RESELECT_TOOLS__.selectorGraph())
  `;
}

export async function getLibVersion() {
  return execute`
    return window.__RESELECT_TOOLS__.version || null;  
  `;
}


export async function resetRecomputations() {
  const str = `(function() {
  })();`;
  return evalPromise(str);
}
