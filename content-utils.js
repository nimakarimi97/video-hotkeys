(() => {
 function normalizeSeekInterval(value, fallback) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 1 && seconds <= 600 ? seconds : fallback;
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

 function isPlaying(video) {
  return !video.paused && !video.ended;
 }

 function getVisibleArea(video, viewportWidth, viewportHeight) {
  const rect = video.getBoundingClientRect?.();
  if (!rect || rect.width <= 0 || rect.height <= 0) {
   return 0;
  }

  const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
  const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
  return visibleWidth * visibleHeight;
 }

 const EDITABLE_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
  '[role="searchbox"]',
  '[role="combobox"]',
 ].join(', ');

 function isTypingTarget(target) {
  if (!target || target.nodeType === 9) return false;
  const tagName = String(target.tagName ?? '').toUpperCase();
  if (
   tagName === 'INPUT' ||
   tagName === 'TEXTAREA' ||
   tagName === 'SELECT' ||
   target.isContentEditable ||
   ['textbox', 'searchbox', 'combobox'].includes(target.getAttribute?.('role'))
  ) {
   return true;
  }
  if (typeof target.closest === 'function') {
   return Boolean(target.closest(EDITABLE_SELECTOR));
  }
  return false;
 }

 function getDeepActiveElement(root) {
  let active = root?.activeElement ?? null;
  while (active?.shadowRoot?.activeElement) {
   active = active.shadowRoot.activeElement;
  }
  return active;
 }

 // event.target is retargeted to the shadow host, so also inspect the composed
 // path and the focused element to find the real editor.
 function isTypingEvent(event, root) {
  if (!event) return false;
  if (event.isComposing || event.keyCode === 229) return true;

  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  return [event.target, getDeepActiveElement(root), ...path].some(isTypingTarget);
 }

 function clampSpeed(value) {
  return Math.min(4, Math.max(0.5, value));
 }

 function isShiftQuestionShortcut(event) {
  return Boolean(event?.shiftKey && (event?.key === '?' || event?.code === 'Slash'));
 }

 function getPageFirstShortcut(event) {
  const key = event?.key?.toLowerCase();
  if (event.ctrlKey || event.metaKey || event.altKey) return null;

  if (key === 'arrowup' || key === 'arrowdown') {
   return event.shiftKey ? null : key;
  }

  return key === 'f' || key === 'm' || key === 'p' ? key : null;
 }

 globalThis.VideoHotkeysUtils = Object.freeze({
  clampSpeed,
  formatTime,
  getPageFirstShortcut,
  getVisibleArea,
  isPlaying,
  isShiftQuestionShortcut,
  isTypingEvent,
  isTypingTarget,
  normalizeSeekInterval,
 });
})();