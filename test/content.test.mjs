import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../content.js', import.meta.url), 'utf8');

function createHarness(initialStorage = {}, videoOverrides = [{}]) {
  const storage = { ...initialStorage };
  const listeners = {};
  const appendedElements = [];
  const videos = videoOverrides.map((overrides) => ({
    currentTime: 100,
    ended: false,
    paused: true,
    playbackRate: 1,
    tagName: 'VIDEO',
    ...overrides
  }));

  const document = {
    addEventListener: (type, listener) => { listeners[`document:${type}`] = listener; },
    body: { appendChild: (element) => appendedElements.push(element) },
    createElement: () => ({ style: {}, remove() { } }),
    getElementById: () => null,
    querySelectorAll: (selector) => selector === 'video' ? videos : []
  };

  const chrome = {
    storage: {
      local: {
        get: (_keys, callback) => callback({ ...storage }),
        remove: (key) => delete storage[key],
        set: (values) => Object.assign(storage, values)
      },
      onChanged: {
        addListener: (listener) => { listeners.storageChanged = listener; }
      }
    }
  };

  const window = {
    addEventListener: (type, listener) => { listeners[type] = listener; },
    setTimeout: (callback) => callback()
  };

  vm.runInNewContext(source, { chrome, document, window });

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
      listeners.keydown(event);
      return event;
    },
    listeners,
    storage,
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

test('clamps speed changes and resets playback speed', () => {
  const harness = createHarness();
  harness.video.playbackRate = 3.9;

  harness.dispatch({ key: '>', shiftKey: true });
  assert.equal(harness.video.playbackRate, 4);

  harness.dispatch({ code: 'Slash', key: '?', shiftKey: true });
  assert.equal(harness.video.playbackRate, 1);
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
});

test('persists toggle changes and disables video shortcuts', () => {
  const harness = createHarness();

  harness.dispatch({ ctrlKey: true, key: 'U', shiftKey: true });
  harness.dispatch({ key: 'ArrowRight' });

  assert.equal(harness.storage.videoHotkeysEnabled, false);
  assert.equal(harness.video.currentTime, 100);
});