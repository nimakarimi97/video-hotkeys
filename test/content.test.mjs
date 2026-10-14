import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../content.js', import.meta.url), 'utf8');
const utilitiesSource = await readFile(new URL('../content-utils.js', import.meta.url), 'utf8');

function createHarness(initialStorage = {}, videoOverrides = [{}], apiName = 'chrome') {
  const storage = { ...initialStorage };
  const listeners = {};
  const appendedElements = [];
  const videos = videoOverrides.map((overrides) => ({
    currentTime: 100,
    ended: false,
    paused: true,
    playbackRate: 1,
    volume: 1,
    muted: false,
    tagName: 'VIDEO',
    requestPictureInPicture: async () => { },
    requestFullscreen: async () => { },
    ...overrides
  }));

  const document = {
    addEventListener: (type, listener) => { listeners[`document:${type}`] = listener; },
    body: { appendChild: (element) => { appendedElements.push(element); } },
    createElement: () => ({ style: {}, remove() { } }),
    getElementById: () => null,
    querySelectorAll: (selector) => selector === 'video' ? videos : []
  };

  const webExtensionApi = {
    storage: {
      local: {
        get: (_keys, callback) => callback ? callback({ ...storage }) : Promise.resolve({ ...storage }),
        remove: (key) => delete storage[key],
        set: (values) => Object.assign(storage, values)
      },
      onChanged: {
        addListener: (listener) => { listeners.storageChanged = listener; }
      }
    }
  };

  const window = {
    addEventListener: (type, listener, capture = false) => {
      listeners[`window:${type}:${capture ? 'capture' : 'bubble'}`] = listener;
    },
    innerWidth: 1200,
    setTimeout: (callback) => callback()
  };

  const context = { [apiName]: webExtensionApi, document, window };
  vm.runInNewContext(utilitiesSource, context);
  vm.runInNewContext(source, context);

  return {
    dispatch(overrides = {}) {
      const event = {
        code: '',
        ctrlKey: false,
        key: '',
        metaKey: false,
        preventDefault() { this.defaultPrevented = true; },
        shiftKey: false,
        stopPropagation() { this.propagationStopped = true; },
        target: { tagName: 'DIV', isContentEditable: false },
        ...overrides
      };
      listeners['window:keydown:capture'](event);
      if (overrides.siteHandled) {
        event.preventDefault();
      }
      listeners['window:keydown:bubble'](event);
      return event;
    },
    listeners,
    storage,
    document,
    appendedElements,
    video: videos[0],
    videos
  };
}

test('migrates the legacy enabled setting', () => {
  const harness = createHarness({ udemyHotkeysEnabled: false });

  assert.equal(harness.storage.videoHotkeysEnabled, false);
  assert.equal('udemyHotkeysEnabled' in harness.storage, false);
});

test('seeks by 5 seconds with ArrowRight', () => {
  const harness = createHarness();
  const event = harness.dispatch({ key: 'ArrowRight' });

  assert.equal(harness.video.currentTime, 105);
  assert.equal(event.defaultPrevented, true);
});

test('seeks by 15 seconds with platform modifier keys', () => {
  const harness = createHarness();

  harness.dispatch({ key: 'ArrowRight', metaKey: true });
  harness.dispatch({ key: 'ArrowLeft', ctrlKey: true });

  assert.equal(harness.video.currentTime, 100);
});

test('uses customizable seek intervals', () => {
  const harness = createHarness({ shortSeekSeconds: 8, longSeekSeconds: 30 });

  harness.dispatch({ key: 'ArrowRight' });
  harness.dispatch({ key: 'ArrowLeft', ctrlKey: true });

  assert.equal(harness.video.currentTime, 78);
});

test('controls the currently playing video instead of the first video', () => {
  const harness = createHarness({}, [{ paused: true }, { paused: false }]);

  harness.dispatch({ key: 'ArrowRight' });

  assert.equal(harness.videos[0].currentTime, 100);
  assert.equal(harness.videos[1].currentTime, 105);
});

test('supports the Firefox promise-based WebExtensions API', async () => {
  const harness = createHarness({ shortSeekSeconds: 9 }, [{}], 'browser');
  await Promise.resolve();

  harness.dispatch({ key: 'ArrowRight' });

  assert.equal(harness.video.currentTime, 109);
});

test('clamps speed changes and resets playback speed', () => {
  const harness = createHarness();
  harness.video.playbackRate = 3.9;

  harness.dispatch({ key: '>', shiftKey: true });
  assert.equal(harness.video.playbackRate, 4);

  harness.dispatch({ code: 'Slash', key: '?', shiftKey: true });
  assert.equal(harness.video.playbackRate, 1);
});

test('places status badges in the fullscreen container aligned to the video', () => {
  const harness = createHarness({}, [{
    getBoundingClientRect: () => ({ top: 100, right: 900 })
  }]);
  let fullscreenBadge;
  harness.document.fullscreenElement = {
    appendChild: (element) => { fullscreenBadge = element; }
  };

  harness.dispatch({ key: '>', shiftKey: true });

  assert.equal(fullscreenBadge.textContent, 'Speed 1.25x');
  assert.match(fullscreenBadge.style.cssText, /top: 156px !important/);
  assert.match(fullscreenBadge.style.cssText, /right: 316px !important/);
});

test('falls back to the video parent or body when placing status badges', () => {
  const parentHarness = createHarness();
  let parentBadge;
  parentHarness.video.parentElement = {
    appendChild: (element) => { parentBadge = element; }
  };
  parentHarness.dispatch({ key: '>', shiftKey: true });
  assert.equal(parentBadge.textContent, 'Speed 1.25x');

  const bodyHarness = createHarness({}, [{ paused: true }, { paused: true }]);
  bodyHarness.dispatch({ ctrlKey: true, key: 'U', shiftKey: true });
  assert.equal(bodyHarness.appendedElements[0].textContent, 'Video hotkeys OFF');
});

test('does not intercept shortcuts in editable controls', () => {
  const harness = createHarness();
  const event = harness.dispatch({ key: 'ArrowRight', target: { tagName: 'INPUT' } });

  assert.equal(harness.video.currentTime, 100);
  assert.equal(event.defaultPrevented, undefined);

  harness.dispatch({
    key: 'ArrowRight',
    target: { tagName: 'DIV', getAttribute: (name) => name === 'role' ? 'textbox' : null }
  });
  assert.equal(harness.video.currentTime, 100);

  harness.dispatch({
    key: 'ArrowRight',
    target: {
      tagName: 'SPAN',
      closest: (sel) => sel.includes('contenteditable') ? true : null
    }
  });
  assert.equal(harness.video.currentTime, 100);
});

test('persists toggle changes and disables video shortcuts', () => {
  const harness = createHarness();

  harness.dispatch({ ctrlKey: true, key: 'U', shiftKey: true });
  harness.dispatch({ key: 'ArrowRight' });

  assert.equal(harness.storage.videoHotkeysEnabled, false);
  assert.equal(harness.video.currentTime, 100);
});

test('handles keydown events with missing or undefined key gracefully', () => {
  const harness = createHarness();

  assert.doesNotThrow(() => {
    harness.dispatch({ key: undefined });
  });
});

test('controls volume and toggles mute', () => {
  const harness = createHarness();

  harness.dispatch({ key: 'ArrowDown' });
  assert.equal(harness.video.volume, 0.95);

  harness.dispatch({ key: 'ArrowUp' });
  assert.equal(harness.video.volume, 1);

  harness.dispatch({ key: 'm' });
  assert.equal(harness.video.muted, true);
});

test('does not change volume with shifted arrow keys', () => {
  const harness = createHarness();

  harness.dispatch({ key: 'ArrowDown', shiftKey: true });
  harness.dispatch({ key: 'ArrowUp', shiftKey: true });

  assert.equal(harness.video.volume, 1);
});

test('toggles Picture-in-Picture and Fullscreen', () => {
  let pipCalled = false;
  let fsCalled = false;
  const harness = createHarness({}, [{
    requestPictureInPicture: async () => { pipCalled = true; },
    parentElement: { requestFullscreen: async () => { fsCalled = true; } }
  }]);

  harness.dispatch({ key: 'p' });
  assert.equal(pipCalled, true);

  harness.dispatch({ key: 'f' });
  assert.equal(fsCalled, true);
});

test('leaves fullscreen to the site when its F shortcut handles the event', () => {
  let fsCalled = false;
  const harness = createHarness({}, [{
    parentElement: { requestFullscreen: async () => { fsCalled = true; } }
  }]);

  const event = harness.dispatch({ key: 'f', siteHandled: true });

  assert.equal(fsCalled, false);
  assert.equal(event.defaultPrevented, true);
});

test('leaves mute, PiP, and volume shortcuts to the site when handled', () => {
  let pipCalled = false;
  const harness = createHarness({}, [{
    requestPictureInPicture: async () => { pipCalled = true; }
  }]);

  harness.dispatch({ key: 'm', siteHandled: true });
  harness.dispatch({ key: 'p', siteHandled: true });
  harness.dispatch({ key: 'ArrowUp', siteHandled: true });

  assert.equal(harness.video.muted, false);
  assert.equal(pipCalled, false);
  assert.equal(harness.video.volume, 1);
});

test('uses the YouTube player shell for the fullscreen fallback', () => {
  let fullscreenTarget;
  const harness = createHarness({}, [{
    closest: (selector) => selector === '.html5-video-player'
      ? { requestFullscreen: async () => { fullscreenTarget = 'player'; } }
      : null,
    parentElement: { requestFullscreen: async () => { fullscreenTarget = 'video'; } }
  }]);

  harness.dispatch({ key: 'f' });

  assert.equal(fullscreenTarget, 'player');
});

test('does not intercept shortcuts when multiple paused videos exist and none was active', () => {
  const harness = createHarness({}, [{ paused: true }, { paused: true }]);

  const event = harness.dispatch({ key: 'ArrowRight' });
  assert.equal(event.defaultPrevented, undefined);
  assert.equal(harness.videos[0].currentTime, 100);
  assert.equal(harness.videos[1].currentTime, 100);
});