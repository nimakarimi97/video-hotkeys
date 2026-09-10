const TOGGLE_STORAGE_KEY = 'udemyHotkeysEnabled';
const enabledInput = document.getElementById('enabled');
const statusText = document.getElementById('status');

function renderStatus(isEnabled) {
 enabledInput.checked = isEnabled;
 statusText.textContent = isEnabled ? 'On' : 'Off';
}

chrome.storage.local.get({ [TOGGLE_STORAGE_KEY]: true }, (result) => {
 renderStatus(Boolean(result[TOGGLE_STORAGE_KEY]));
});

enabledInput.addEventListener('change', () => {
 const isEnabled = enabledInput.checked;
 chrome.storage.local.set({ [TOGGLE_STORAGE_KEY]: isEnabled });
 renderStatus(isEnabled);
});