const TOGGLE_STORAGE_KEY = 'videoHotkeysEnabled';
const LEGACY_TOGGLE_STORAGE_KEY = 'udemyHotkeysEnabled';
const SHORT_SEEK_STORAGE_KEY = 'shortSeekSeconds';
const LONG_SEEK_STORAGE_KEY = 'longSeekSeconds';
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

function normalizeSeekInterval(value, fallback) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 1 && seconds <= 600 ? seconds : fallback;
}

storageGet(
  [TOGGLE_STORAGE_KEY, LEGACY_TOGGLE_STORAGE_KEY, SHORT_SEEK_STORAGE_KEY, LONG_SEEK_STORAGE_KEY],
  (result) => {
    const storedValue = result[TOGGLE_STORAGE_KEY] ?? result[LEGACY_TOGGLE_STORAGE_KEY];
    isHotkeyEnabled = storedValue === undefined ? true : Boolean(storedValue);
    shortSeekSeconds = normalizeSeekInterval(result[SHORT_SEEK_STORAGE_KEY], 5);
    longSeekSeconds = normalizeSeekInterval(result[LONG_SEEK_STORAGE_KEY], 15);

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
    shortSeekSeconds = normalizeSeekInterval(changes[SHORT_SEEK_STORAGE_KEY].newValue, 5);
  }
  if (changes[LONG_SEEK_STORAGE_KEY]) {
    longSeekSeconds = normalizeSeekInterval(changes[LONG_SEEK_STORAGE_KEY].newValue, 15);
  }
});

function createBadge(id, text, styleProperties, duration = 1200) {
  if (!document.body)
    return;


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
  badge.style.cssText = Object.entries(mergedStyles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');

  document.body.appendChild(badge);
  window.setTimeout(() => badge.remove(), duration);
}

function showToggleStatus(isEnabled) {
  createBadge(
    'video-hotkeys-toggle-status',
    `Video hotkeys ${isEnabled ? 'ON' : 'OFF'}`,
    {
      'top': '16px !important',
      'right': '16px !important',
      'background': `${isEnabled ? '#0a7f44' : '#9b1c1c'} !important`,
    },
    1300
  );
}

function showSpeedStatus(speed) {
  createBadge(
    'video-hotkeys-speed-status',
    `Speed ${speed.toFixed(2)}x`,
    {
      'top': '56px !important',
      'right': '16px !important',
      'background': '#1f2937 !important',
    },
    1200
  );
}

function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const secStr = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${secStr}`;
  }
  return `${minutes}:${secStr}`;
}

function showSeekStatus(seconds, currentTime) {
  const sign = seconds > 0 ? '+' : '';
  const timeText = Number.isFinite(currentTime) ? ` (${formatTime(currentTime)})` : '';
  createBadge(
    'video-hotkeys-seek-status',
    `Seek ${sign}${seconds}s${timeText}`,
    {
      'top': '96px !important',
      'right': '16px !important',
      'background': '#1f2937 !important',
    },
    900
  );
}

function showVolumeStatus(volume, isMuted) {
  const text = isMuted || volume === 0 ? 'Volume: Muted' : `Volume: ${Math.round(volume * 100)}%`;
  createBadge(
    'video-hotkeys-volume-status',
    text,
    {
      'top': '136px !important',
      'right': '16px !important',
      'background': '#1f2937 !important',
    },
    900
  );
}

function showInfoStatus(text) {
  createBadge(
    'video-hotkeys-info-status',
    text,
    {
      'top': '176px !important',
      'right': '16px !important',
      'background': '#1f2937 !important',
    },
    900
  );
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

function isTypingTarget(target) {
  if (!target) return false;
  const tagName = target.tagName;
  if (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable ||
    target.getAttribute?.('role') === 'textbox'
  ) {
    return true;
  }
  if (typeof target.closest === 'function') {
    return Boolean(
      target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')
    );
  }
  return false;
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
  if (activeVideo && videos.includes(activeVideo) && isPlaying(activeVideo)) {
    return activeVideo;
  }

  const playingVideos = videos.filter(isPlaying);
  if (playingVideos.length > 0) {
    return playingVideos.reduce((best, video) =>
      getVisibleArea(video) > getVisibleArea(best) ? video : best
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

function clampSpeed(value) {
  return Math.min(4, Math.max(0.5, value));
}

function setVideoSpeed(video, nextSpeed) {
  const clamped = clampSpeed(nextSpeed);
  video.playbackRate = clamped;
  showSpeedStatus(clamped);
}

function isShiftQuestionShortcut(event) {
  return Boolean(event?.shiftKey && (event?.key === '?' || event?.code === 'Slash'));
}

window.addEventListener(
  'keydown',
  (event) => {
    const key = event?.key?.toLowerCase();

    if (event?.ctrlKey && event?.shiftKey && key === 'u') {
      isHotkeyEnabled = !isHotkeyEnabled;
      storageSet({ [TOGGLE_STORAGE_KEY]: isHotkeyEnabled });
      showToggleStatus(isHotkeyEnabled);
      event.preventDefault();
      return;
    }

    if (!isHotkeyEnabled) {
      return;
    }

    const target = event.target;
    if (isTypingTarget(target)) {
      return;
    }

    const video = getPageVideo();

    if (
      (event.metaKey || event.ctrlKey) &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      if (video) {
        const delta = event.key === 'ArrowRight' ? longSeekSeconds : -longSeekSeconds;
        video.currentTime += delta;
        showSeekStatus(delta, video.currentTime);
        event.preventDefault();
      }
      return;
    }

    if (event.shiftKey && event.key === 'ArrowUp') {
      if (video) {
        video.muted = false;
        video.volume = Math.min(1, Math.round((video.volume + 0.05) * 100) / 100);
        showVolumeStatus(video.volume, video.muted);
        event.preventDefault();
      }
      return;
    }

    if (event.shiftKey && event.key === 'ArrowDown') {
      if (video) {
        video.volume = Math.max(0, Math.round((video.volume - 0.05) * 100) / 100);
        showVolumeStatus(video.volume, video.muted);
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
        showSeekStatus(shortSeekSeconds, video.currentTime);
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      if (video) {
        video.currentTime -= shortSeekSeconds;
        showSeekStatus(-shortSeekSeconds, video.currentTime);
        event.preventDefault();
      }
      return;
    }

    if (key === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (video) {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture?.().catch?.(() => { });
          showInfoStatus('PiP: Off');
        } else if (typeof video.requestPictureInPicture === 'function') {
          video.requestPictureInPicture().then?.(() => {
            showInfoStatus('PiP: On');
          })?.catch?.(() => { });
        }
        event.preventDefault();
      }
      return;
    }

    if (key === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (video) {
        const fsElement = document.fullscreenElement ?? document.webkitFullscreenElement;
        if (fsElement) {
          if (document.exitFullscreen) document.exitFullscreen().catch?.(() => { });
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          showInfoStatus('Fullscreen: Off');
        } else {
          const targetEl = video.parentElement || video;
          if (targetEl.requestFullscreen) targetEl.requestFullscreen().catch?.(() => { });
          else if (targetEl.webkitRequestFullscreen) targetEl.webkitRequestFullscreen();
          showInfoStatus('Fullscreen: On');
        }
        event.preventDefault();
      }
      return;
    }

    if (key === 'm' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (video) {
        video.muted = !video.muted;
        showVolumeStatus(video.volume, video.muted);
        event.preventDefault();
      }
      return;
    }
  },
  true
);