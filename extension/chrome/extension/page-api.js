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

export function checkSelector(id) {
  const str = `(function() {
    const __reselect_last_check = window.__RESELECT_TOOLS__.checkSelector('${id}');
    console.log(__reselect_last_check);
    return JSON.stringify(__reselect_last_check);
  })()`;
  return evalPromise(str);
}

export function selectorGraph() {
  const str = 'JSON.stringify(window.__RESELECT_TOOLS__.selectorGraph())';
  return evalPromise(str);
}
