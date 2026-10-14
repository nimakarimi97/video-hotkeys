const TOGGLE_STORAGE_KEY = 'videoHotkeysEnabled';
const LEGACY_TOGGLE_STORAGE_KEY = 'udemyHotkeysEnabled';
const SHORT_SEEK_STORAGE_KEY = 'shortSeekSeconds';
const LONG_SEEK_STORAGE_KEY = 'longSeekSeconds';
const extensionApi = globalThis.browser ?? globalThis.chrome;
const enabledInput = document.getElementById('enabled');
const shortSeekInput = document.getElementById('short-seek');
const longSeekInput = document.getElementById('long-seek');
const shortSeekLabel = document.getElementById('short-seek-label');
const shortSeekBackLabel = document.getElementById('short-seek-back-label');
const longSeekForwardLabel = document.getElementById('long-seek-forward-label');
const longSeekBackLabel = document.getElementById('long-seek-back-label');
const statusText = document.getElementById('status');

function storageGet(keys, callback) {
 if (globalThis.browser) {
  extensionApi.storage.local.get(keys).then(callback);
 } else {
  extensionApi.storage.local.get(keys, callback);
 }
}

function storageSet(values) {
 extensionApi.storage.local.set(values);
}

function normalizeSeekInterval(value, fallback) {
 const seconds = Number(value);
 return Number.isFinite(seconds) && seconds >= 1 && seconds <= 600 ? seconds : fallback;
}

function renderStatus(isEnabled) {
 enabledInput.checked = isEnabled;
 statusText.textContent = isEnabled ? 'On' : 'Off';
}

function renderSeekIntervals(shortSeconds, longSeconds) {
 shortSeekInput.value = shortSeconds;
 longSeekInput.value = longSeconds;
 shortSeekLabel.textContent = `Forward ${shortSeconds} seconds`;
 if (shortSeekBackLabel) {
  shortSeekBackLabel.textContent = `Back ${shortSeconds} seconds`;
 }
 longSeekForwardLabel.textContent = `Forward ${longSeconds} seconds`;
 longSeekBackLabel.textContent = `Back ${longSeconds} seconds`;
}

storageGet(
 [TOGGLE_STORAGE_KEY, LEGACY_TOGGLE_STORAGE_KEY, SHORT_SEEK_STORAGE_KEY, LONG_SEEK_STORAGE_KEY],
 (result) => {
  const storedValue = result[TOGGLE_STORAGE_KEY] ?? result[LEGACY_TOGGLE_STORAGE_KEY];
  const isEnabled = storedValue === undefined ? true : Boolean(storedValue);
  const shortSeconds = normalizeSeekInterval(result[SHORT_SEEK_STORAGE_KEY], 5);
  const longSeconds = normalizeSeekInterval(result[LONG_SEEK_STORAGE_KEY], 15);
  renderStatus(isEnabled);
  renderSeekIntervals(shortSeconds, longSeconds);

  if (result[TOGGLE_STORAGE_KEY] === undefined && result[LEGACY_TOGGLE_STORAGE_KEY] !== undefined) {
    storageSet({ [TOGGLE_STORAGE_KEY]: isEnabled });
    extensionApi.storage.local.remove(LEGACY_TOGGLE_STORAGE_KEY);
  }
 }
);

enabledInput.addEventListener('change', () => {
 const isEnabled = enabledInput.checked;
 storageSet({ [TOGGLE_STORAGE_KEY]: isEnabled });
 renderStatus(isEnabled);
});

function saveSeekIntervals() {
 const shortSeconds = normalizeSeekInterval(shortSeekInput.value, 5);
 const longSeconds = normalizeSeekInterval(longSeekInput.value, 15);
 storageSet({
  [SHORT_SEEK_STORAGE_KEY]: shortSeconds,
  [LONG_SEEK_STORAGE_KEY]: longSeconds
 });
 renderSeekIntervals(shortSeconds, longSeconds);
}

shortSeekInput.addEventListener('change', saveSeekIntervals);
longSeekInput.addEventListener('change', saveSeekIntervals);