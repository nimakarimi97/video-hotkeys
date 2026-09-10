const TOGGLE_STORAGE_KEY = 'videoHotkeysEnabled';
const LEGACY_TOGGLE_STORAGE_KEY = 'udemyHotkeysEnabled';
const enabledInput = document.getElementById('enabled');
const statusText = document.getElementById('status');

function renderStatus(isEnabled) {
 enabledInput.checked = isEnabled;
 statusText.textContent = isEnabled ? 'On' : 'Off';
}

chrome.storage.local.get(
 [TOGGLE_STORAGE_KEY, LEGACY_TOGGLE_STORAGE_KEY],
 (result) => {
  const storedValue = result[TOGGLE_STORAGE_KEY] ?? result[LEGACY_TOGGLE_STORAGE_KEY];
  const isEnabled = storedValue === undefined ? true : Boolean(storedValue);
  renderStatus(isEnabled);

  if (result[TOGGLE_STORAGE_KEY] === undefined && result[LEGACY_TOGGLE_STORAGE_KEY] !== undefined) {
   chrome.storage.local.set({ [TOGGLE_STORAGE_KEY]: isEnabled });
   chrome.storage.local.remove(LEGACY_TOGGLE_STORAGE_KEY);
  }
 }
);

enabledInput.addEventListener('change', () => {
 const isEnabled = enabledInput.checked;
 chrome.storage.local.set({ [TOGGLE_STORAGE_KEY]: isEnabled });
 renderStatus(isEnabled);
});