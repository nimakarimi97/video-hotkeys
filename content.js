const TOGGLE_STORAGE_KEY = 'videoHotkeysEnabled';
const LEGACY_TOGGLE_STORAGE_KEY = 'udemyHotkeysEnabled';
let isHotkeyEnabled = true;

chrome.storage.local.get(
 [TOGGLE_STORAGE_KEY, LEGACY_TOGGLE_STORAGE_KEY],
 (result) => {
  const storedValue = result[TOGGLE_STORAGE_KEY] ?? result[LEGACY_TOGGLE_STORAGE_KEY];
  isHotkeyEnabled = storedValue === undefined ? true : Boolean(storedValue);

  if (result[TOGGLE_STORAGE_KEY] === undefined && result[LEGACY_TOGGLE_STORAGE_KEY] !== undefined) {
   chrome.storage.local.set({ [TOGGLE_STORAGE_KEY]: isHotkeyEnabled });
   chrome.storage.local.remove(LEGACY_TOGGLE_STORAGE_KEY);
  }
 }
);

chrome.storage.onChanged.addListener((changes, areaName) => {
 if (areaName === 'local' && changes[TOGGLE_STORAGE_KEY]) {
  isHotkeyEnabled = Boolean(changes[TOGGLE_STORAGE_KEY].newValue);
 }
});

function showToggleStatus(isEnabled) {
 const existing = document.getElementById('video-hotkeys-toggle-status');
 if (existing) {
  existing.remove();
 }

 const badge = document.createElement('div');
 badge.id = 'video-hotkeys-toggle-status';
 badge.textContent = `Video hotkeys ${isEnabled ? 'ON' : 'OFF'}`;
 badge.style.position = 'fixed';
 badge.style.top = '16px';
 badge.style.right = '16px';
 badge.style.zIndex = '2147483647';
 badge.style.padding = '8px 12px';
 badge.style.borderRadius = '8px';
 badge.style.fontFamily = 'system-ui, -apple-system, Segoe UI, sans-serif';
 badge.style.fontSize = '12px';
 badge.style.fontWeight = '600';
 badge.style.background = isEnabled ? '#0a7f44' : '#9b1c1c';
 badge.style.color = '#fff';
 badge.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';

 document.body.appendChild(badge);
 window.setTimeout(() => badge.remove(), 1300);
}

function showSpeedStatus(speed) {
 const existing = document.getElementById('video-hotkeys-speed-status');
 if (existing) {
  existing.remove();
 }

 const badge = document.createElement('div');
 badge.id = 'video-hotkeys-speed-status';
 badge.textContent = `Speed ${speed.toFixed(2)}x`;
 badge.style.position = 'fixed';
 badge.style.top = '56px';
 badge.style.right = '16px';
 badge.style.zIndex = '2147483647';
 badge.style.padding = '8px 12px';
 badge.style.borderRadius = '8px';
 badge.style.fontFamily = 'system-ui, -apple-system, Segoe UI, sans-serif';
 badge.style.fontSize = '12px';
 badge.style.fontWeight = '600';
 badge.style.background = '#1f2937';
 badge.style.color = '#fff';
 badge.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';

 document.body.appendChild(badge);
 window.setTimeout(() => badge.remove(), 1200);
}

function getPageVideo() {
 return document.querySelector('video');
}

function clampSpeed(value) {
 return Math.min(4, Math.max(0.5, value));
}

function setVideoSpeed(video, nextSpeed) {
 const clamped = clampSpeed(nextSpeed);
 video.playbackRate = clamped;
 showSpeedStatus(clamped);
}

function isShiftQuestionShortcut(event) {
 return event.shiftKey && (event.key === '?' || event.code === 'Slash');
}

window.addEventListener(
 'keydown',
 (event) => {
  const key = event.key.toLowerCase();

  if (event.ctrlKey && event.shiftKey && key === 'u') {
   isHotkeyEnabled = !isHotkeyEnabled;
   chrome.storage.local.set({ [TOGGLE_STORAGE_KEY]: isHotkeyEnabled });
   showToggleStatus(isHotkeyEnabled);
   event.preventDefault();
   return;
  }

  if (!isHotkeyEnabled) {
   return;
  }

  const target = event.target;
  const tagName = target?.tagName;
  const isTypingField =
   tagName === 'INPUT' ||
   tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target?.isContentEditable ||
    target?.getAttribute?.('role') === 'textbox';

  if (isTypingField) {
   return;
  }

  const video = getPageVideo();

  if (
   (event.metaKey || event.ctrlKey) &&
   (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
  ) {
   if (video) {
    video.currentTime += event.key === 'ArrowRight' ? 15 : -15;
    event.preventDefault();
   }
   return;
  }

  if (event.shiftKey && event.key === '>') {
   if (video) {
    setVideoSpeed(video, video.playbackRate + 0.25);
    event.preventDefault();
   }
   return;
  }

  if (event.shiftKey && event.key === '<') {
   if (video) {
    setVideoSpeed(video, video.playbackRate - 0.25);
    event.preventDefault();
   }
   return;
  }

  if (isShiftQuestionShortcut(event)) {
   if (video) {
    setVideoSpeed(video, 1);
    event.preventDefault();
    event.stopPropagation();
   }
   return;
  }

  if (event.key === 'ArrowRight') {
   if (video) {
    video.currentTime += 5;
    event.preventDefault();
   }
  }
 },
 true
);