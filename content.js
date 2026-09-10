const TOGGLE_STORAGE_KEY = 'videoHotkeysEnabled';
const LEGACY_TOGGLE_STORAGE_KEY = 'udemyHotkeysEnabled';
const SHORT_SEEK_STORAGE_KEY = 'shortSeekSeconds';
const LONG_SEEK_STORAGE_KEY = 'longSeekSeconds';
let isHotkeyEnabled = true;
let shortSeekSeconds = 5;
let longSeekSeconds = 15;
let activeVideo = null;

function normalizeSeekInterval(value, fallback) {
 const seconds = Number(value);
 return Number.isFinite(seconds) && seconds >= 1 && seconds <= 600 ? seconds : fallback;
}

chrome.storage.local.get(
 [TOGGLE_STORAGE_KEY, LEGACY_TOGGLE_STORAGE_KEY, SHORT_SEEK_STORAGE_KEY, LONG_SEEK_STORAGE_KEY],
 (result) => {
  const storedValue = result[TOGGLE_STORAGE_KEY] ?? result[LEGACY_TOGGLE_STORAGE_KEY];
  isHotkeyEnabled = storedValue === undefined ? true : Boolean(storedValue);
   shortSeekSeconds = normalizeSeekInterval(result[SHORT_SEEK_STORAGE_KEY], 5);
   longSeekSeconds = normalizeSeekInterval(result[LONG_SEEK_STORAGE_KEY], 15);

  if (result[TOGGLE_STORAGE_KEY] === undefined && result[LEGACY_TOGGLE_STORAGE_KEY] !== undefined) {
     chrome.storage.local.set({ [TOGGLE_STORAGE_KEY]: isHotkeyEnabled });
     chrome.storage.local.remove(LEGACY_TOGGLE_STORAGE_KEY);
  }
 }
);

chrome.storage.onChanged.addListener((changes, areaName) => {
 if (areaName !== 'local') {
  return;
 }

 if (changes[TOGGLE_STORAGE_KEY]) {
  isHotkeyEnabled = Boolean(changes[TOGGLE_STORAGE_KEY].newValue);
 }
 if (changes[SHORT_SEEK_STORAGE_KEY]) {
  shortSeekSeconds = normalizeSeekInterval(changes[SHORT_SEEK_STORAGE_KEY].newValue, 5);
 }
 if (changes[LONG_SEEK_STORAGE_KEY]) {
  longSeekSeconds = normalizeSeekInterval(changes[LONG_SEEK_STORAGE_KEY].newValue, 15);
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

function isPlaying(video) {
 return !video.paused && !video.ended;
}

function getVisibleArea(video) {
 const rect = video.getBoundingClientRect?.();
 if (!rect || rect.width <= 0 || rect.height <= 0) {
  return 0;
 }

 const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
 const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
 return visibleWidth * visibleHeight;
}

function getPageVideo() {
 const videos = Array.from(document.querySelectorAll('video'));
 if (activeVideo && videos.includes(activeVideo) && isPlaying(activeVideo)) {
  return activeVideo;
 }

 const playingVideos = videos.filter(isPlaying);
 if (playingVideos.length > 0) {
  return playingVideos.reduce((best, video) =>
   getVisibleArea(video) > getVisibleArea(best) ? video : best
  );
 }

 return activeVideo && videos.includes(activeVideo) ? activeVideo : videos[0] ?? null;
}

document.addEventListener('play', (event) => {
 if (event.target?.tagName === 'VIDEO') {
  activeVideo = event.target;
 }
}, true);

document.addEventListener('pointerdown', (event) => {
 if (event.target?.tagName === 'VIDEO') {
  activeVideo = event.target;
 }
}, true);

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
      video.currentTime += event.key === 'ArrowRight' ? longSeekSeconds : -longSeekSeconds;
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
      video.currentTime += shortSeekSeconds;
    event.preventDefault();
   }
  }
 },
 true
);