const TOGGLE_STORAGE_KEY = 'videoHotkeysEnabled';
const LEGACY_TOGGLE_STORAGE_KEY = 'udemyHotkeysEnabled';
const SHORT_SEEK_STORAGE_KEY = 'shortSeekSeconds';
const LONG_SEEK_STORAGE_KEY = 'longSeekSeconds';
const videoUtils = globalThis.VideoHotkeysUtils;
const extensionApi = globalThis.browser ?? globalThis.chrome;
let isHotkeyEnabled = true;
let shortSeekSeconds = 5;
let longSeekSeconds = 15;
let activeVideo = null;

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

function storageRemove(key) {
  extensionApi.storage.local.remove(key);
}

storageGet(
  [TOGGLE_STORAGE_KEY, LEGACY_TOGGLE_STORAGE_KEY, SHORT_SEEK_STORAGE_KEY, LONG_SEEK_STORAGE_KEY],
  (result) => {
    const storedValue = result[TOGGLE_STORAGE_KEY] ?? result[LEGACY_TOGGLE_STORAGE_KEY];
    isHotkeyEnabled = storedValue === undefined ? true : Boolean(storedValue);
    shortSeekSeconds = videoUtils.normalizeSeekInterval(result[SHORT_SEEK_STORAGE_KEY], 5);
    longSeekSeconds = videoUtils.normalizeSeekInterval(result[LONG_SEEK_STORAGE_KEY], 15);

    if (result[TOGGLE_STORAGE_KEY] === undefined && result[LEGACY_TOGGLE_STORAGE_KEY] !== undefined) {
      storageSet({ [TOGGLE_STORAGE_KEY]: isHotkeyEnabled });
      storageRemove(LEGACY_TOGGLE_STORAGE_KEY);
    }
  }
);

extensionApi.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') {
    return;
  }

  if (changes[TOGGLE_STORAGE_KEY]) {
    isHotkeyEnabled = Boolean(changes[TOGGLE_STORAGE_KEY].newValue);
  }
  if (changes[SHORT_SEEK_STORAGE_KEY]) {
    shortSeekSeconds = videoUtils.normalizeSeekInterval(changes[SHORT_SEEK_STORAGE_KEY].newValue, 5);
  }
  if (changes[LONG_SEEK_STORAGE_KEY]) {
    longSeekSeconds = videoUtils.normalizeSeekInterval(changes[LONG_SEEK_STORAGE_KEY].newValue, 15);
  }
});

function createBadge(id, text, styleProperties, duration = 1200, targetVideo = getPageVideo()) {
  if (!document.body) {
    return;
  }

  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const badge = document.createElement('div');
  badge.id = id;
  badge.textContent = text;

  const baseStyles = {
    'position': 'fixed !important',
    'z-index': '2147483647 !important',
    'padding': '8px 12px !important',
    'border-radius': '8px !important',
    'font-family': 'system-ui, -apple-system, Segoe UI, sans-serif !important',
    'font-size': '12px !important',
    'font-weight': '600 !important',
    'color': '#fff !important',
    'box-shadow': '0 8px 24px rgba(0, 0, 0, 0.2) !important',
    'pointer-events': 'none !important',
    'margin': '0 !important',
    'border': 'none !important',
    'display': 'block !important',
    'visibility': 'visible !important',
  };

  const mergedStyles = { ...baseStyles, ...styleProperties };
  const videoRect = targetVideo?.getBoundingClientRect?.();
  if (videoRect && Number.isFinite(window.innerWidth)) {
    const top = Number.parseFloat(mergedStyles.top);
    const right = Number.parseFloat(mergedStyles.right);
    if (Number.isFinite(top)) {
      mergedStyles.top = `${videoRect.top + top}px !important`;
    }
    if (Number.isFinite(right)) {
      mergedStyles.right = `${window.innerWidth - videoRect.right + right}px !important`;
    }
  }

  badge.style.cssText = Object.entries(mergedStyles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');

  const fullscreenElement = document.fullscreenElement ?? document.webkitFullscreenElement;
  const preferredHost = fullscreenElement && fullscreenElement !== targetVideo
    ? fullscreenElement
    : targetVideo?.parentElement ?? document.body;
  const host = typeof preferredHost.appendChild === 'function' ? preferredHost : document.body;
  host.appendChild(badge);
  window.setTimeout(() => badge.remove(), duration);
}

function showToggleStatus(isEnabled, video) {
  createBadge(
    'video-hotkeys-toggle-status',
    `Video hotkeys ${isEnabled ? 'ON' : 'OFF'}`,
    {
      'top': '16px !important',
      'right': '16px !important',
      'background': `${isEnabled ? '#0a7f44' : '#9b1c1c'} !important`,
    },
    1300,
    video
  );
}

function showSpeedStatus(speed, video) {
  createBadge(
    'video-hotkeys-speed-status',
    `Speed ${speed.toFixed(2)}x`,
    {
      'top': '56px !important',
      'right': '16px !important',
      'background': '#1f2937 !important',
      '-webkit-touch-callout': 'none !important',
      '-webkit-user-select': 'none !important',
      '-khtml-user-select': 'none !important',
      '-moz-user-select': 'none !important',
      '-ms-user-select': 'none !important',
      'user-select': 'none !important',
    },
    1200,
    video
  );
}

function showSeekStatus(seconds, currentTime, video) {
  const sign = seconds > 0 ? '+' : '';
  const timeText = Number.isFinite(currentTime) ? ` (${videoUtils.formatTime(currentTime)})` : '';
  createBadge(
    'video-hotkeys-seek-status',
    `Seek ${sign}${seconds}s${timeText}`,
    {
      'top': '96px !important',
      'right': '16px !important',
      'background': '#1f2937 !important',
    },
    900,
    video
  );
}

function showVolumeStatus(volume, isMuted, video) {
  const text = isMuted || volume === 0 ? 'Volume: Muted' : `Volume: ${Math.round(volume * 100)}%`;
  createBadge(
    'video-hotkeys-volume-status',
    text,
    {
      'top': '136px !important',
      'right': '16px !important',
      'background': '#1f2937 !important',
    },
    900,
    video
  );
}

function showInfoStatus(text, video) {
  createBadge(
    'video-hotkeys-info-status',
    text,
    {
      'top': '176px !important',
      'right': '16px !important',
      'background': '#1f2937 !important',
    },
    900,
    video
  );
}

function getAllVideos(root = document) {
  const videos = [];
  if (!root?.querySelectorAll) return videos;

  videos.push(...Array.from(root.querySelectorAll('video')));

  // Traverse open shadow roots
  const allElements = root.querySelectorAll('*');
  for (const el of allElements) {
    if (el.shadowRoot) {
      videos.push(...getAllVideos(el.shadowRoot));
    }
  }

  return videos;
}

function getPageVideo() {
  const videos = getAllVideos();
  if (activeVideo && videos.includes(activeVideo) && videoUtils.isPlaying(activeVideo)) {
    return activeVideo;
  }

  const playingVideos = videos.filter(videoUtils.isPlaying);
  if (playingVideos.length > 0) {
    return playingVideos.reduce((best, video) =>
      videoUtils.getVisibleArea(video, window.innerWidth, window.innerHeight) >
        videoUtils.getVisibleArea(best, window.innerWidth, window.innerHeight) ? video : best
    );
  }

  if (activeVideo && videos.includes(activeVideo)) {
    return activeVideo;
  }

  return videos.length === 1 ? videos[0] : null;
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

function setVideoSpeed(video, nextSpeed) {
  const clamped = videoUtils.clampSpeed(nextSpeed);
  video.playbackRate = clamped;
  showSpeedStatus(clamped, video);
}

function changeVideoSpeed(video, step) {
  setVideoSpeed(video, video.playbackRate + step);
}

function canHandleVideoShortcut(event) {
  return isHotkeyEnabled && !videoUtils.isTypingEvent(event, document);
}

async function toggleFullscreen(video) {
  const fullscreenElement = document.fullscreenElement ?? document.webkitFullscreenElement;
  const target = fullscreenElement
    ? document
    : video.closest?.('.html5-video-player') ?? video.parentElement ?? video;
  const action = fullscreenElement
    ? document.exitFullscreen ?? document.webkitExitFullscreen
    : target.requestFullscreen ?? target.webkitRequestFullscreen;

  if (typeof action !== 'function') {
    showInfoStatus('Fullscreen unavailable on this page', video);
    return;
  }

  if (!fullscreenElement && globalThis.navigator?.userActivation?.isActive === false) {
    showInfoStatus('Fullscreen needs a user gesture. Press F again or use the player controls.', video);
    return;
  }

  try {
    // Invoke before awaiting so the keyboard gesture's activation is preserved.
    await action.call(target);
  } catch (error) {
    showInfoStatus(`Fullscreen failed: ${error.message ?? error}`, video);
    return;
  }

  showInfoStatus(`Fullscreen: ${fullscreenElement ? 'Off' : 'On'}`, video);
}

function toggleMute(video) {
  video.muted = !video.muted;
  showVolumeStatus(video.volume, video.muted, video);
}

function togglePictureInPicture(video) {
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture?.().catch?.(() => { });
    showInfoStatus('PiP: Off', video);
  } else if (typeof video.requestPictureInPicture === 'function') {
    video.requestPictureInPicture().then?.(() => {
      showInfoStatus('PiP: On', video);
    })?.catch?.(() => { });
  }
}

function adjustVolume(video, delta) {
  if (delta > 0) video.muted = false;
  video.volume = Math.min(1, Math.max(0, Math.round((video.volume + delta) * 100) / 100));
  showVolumeStatus(video.volume, video.muted, video);
}

const pageFirstShortcutActions = {
  f: toggleFullscreen,
  m: toggleMute,
  p: togglePictureInPicture,
  arrowup: (video) => adjustVolume(video, 0.05),
  arrowdown: (video) => adjustVolume(video, -0.05),
};

function getPageFirstShortcut(event) {
  const key = event?.key?.toLowerCase();
  if (event.ctrlKey || event.metaKey || event.altKey) return null;

  if (key === 'arrowup' || key === 'arrowdown') {
    return event.shiftKey ? null : key;
  }

  return key === 'f' || key === 'm' || key === 'p' ? key : null;
}

function handlePageFirstShortcut(event) {
  if (event.defaultPrevented || !canHandleVideoShortcut(event)) return;

  const shortcut = videoUtils.getPageFirstShortcut(event);
  const action = pageFirstShortcutActions[shortcut];
  if (!action) return;
  if (shortcut === 'f' && event.repeat) return;

  const video = getPageVideo();
  if (!video) return;

  action(video);
  event.preventDefault();
}

window.addEventListener(
  'keydown',
  (event) => {
    const key = event?.key?.toLowerCase();

    if (event?.ctrlKey && event?.shiftKey && key === 'u') {
      isHotkeyEnabled = !isHotkeyEnabled;
      storageSet({ [TOGGLE_STORAGE_KEY]: isHotkeyEnabled });
      showToggleStatus(isHotkeyEnabled, getPageVideo());
      event.preventDefault();
      return;
    }

    if (!canHandleVideoShortcut(event)) return;

    const video = getPageVideo();

    if (
      (event.metaKey || event.ctrlKey) &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      if (!video) return;
      const delta = event.key === 'ArrowRight' ? longSeekSeconds : -longSeekSeconds;
      video.currentTime += delta;
      showSeekStatus(delta, video.currentTime, video);
      event.preventDefault();
      return;
    }

    if (event.shiftKey && event.key === '>') {
      if (!video) return;
      changeVideoSpeed(video, 0.25);
      event.preventDefault();
      return;
    }

    if (event.shiftKey && event.key === '<') {
      if (!video) return;
      changeVideoSpeed(video, -0.25);
      event.preventDefault();
      return;
    }

    if (videoUtils.isShiftQuestionShortcut(event)) {
      if (!video) return;
      setVideoSpeed(video, 1);
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (
      event.key === 'ArrowRight' &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey
    ) {
      if (!video) return;
      video.currentTime += shortSeekSeconds;
      showSeekStatus(shortSeekSeconds, video.currentTime, video);
      event.preventDefault();
      return;
    }

    if (
      event.key === 'ArrowLeft' &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey
    ) {
      if (!video) return;
      video.currentTime -= shortSeekSeconds;
      showSeekStatus(-shortSeekSeconds, video.currentTime, video);
      event.preventDefault();
      return;
    }

  },
  true
);

window.addEventListener('keydown', handlePageFirstShortcut, false);