let panelCreated = false;
let loadCheckInterval;

const checkForDevtools = cb => chrome.devtools.inspectedWindow.eval('!!(Object.keys(window.__RESELECT_TOOLS__ || {}).length)', cb);


function onCheck(pageHasDevtools) {
  if (!pageHasDevtools || panelCreated) {
    return;
  }

  clearInterval(loadCheckInterval);
  panelCreated = true;
  chrome.devtools.panels.create('Reselect', '', 'panel.html');
}

function createPanelIfDevtoolsLoaded() {
  if (panelCreated) return;
  checkForDevtools(onCheck);
}

chrome.devtools.network.onNavigated.addListener(createPanelIfDevtoolsLoaded);

// Check to see if Reselect Tools have loaded once per second in case Reselect tools were added
// after page load
loadCheckInterval = setInterval(createPanelIfDevtoolsLoaded, 1000);

createPanelIfDevtoolsLoaded();
