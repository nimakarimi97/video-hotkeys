# Changelog

All notable changes to Video Hotkeys are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [1.6.3] - 2026-10-26

### Fixed

- Stop `F`, `M`, `P`, and arrow shortcuts from firing while typing in rich-text editors, such as LinkedIn comments and messages.
- Detect editors inside shadow DOM, ARIA textbox/search/combobox fields, and non-boolean `contenteditable` values.
- Ignore shortcuts during IME composition.

## [1.6.2] - 2026-10-26

### Fixed

- Avoid fullscreen requests when browser user activation is unavailable.
- Report fullscreen failures instead of displaying a false success status.
- Ignore repeated fullscreen keydown events while holding `F`.
- Register keyboard shortcuts before page scripts run to prevent conflicts on YouTube Shorts.
- Make the speed status text non-selectable.

## [1.6.0] - 2026-10-14

### Added

- Picture-in-Picture (`P`) and Fullscreen (`F`) keyboard shortcuts.
- Volume adjustment (`Shift + Up/Down`) and mute/unmute toggle (`M`).
- On-screen display (OSD) status badges for seeking time, volume, and player state.
- Short-seek backward (`Left Arrow`) shortcut and guide entry in the popup.
- Shadow DOM traversal for web-component video players.
- Embedded video support across iframes with `all_frames: true`.
- Player controls section in popup guide.

### Changed

- Enhanced editable field detection to support nested `contenteditable` elements.
- Improved video selection logic to avoid hijacking shortcuts on pages with multiple inactive videos.

## [1.5.0] - 2026-09-10

### Added

- Automatic selection of the currently playing video on multi-video pages.
- Customizable short and long seek intervals with `5` and `15` second defaults.
- Firefox support through the promise-based WebExtensions API and Gecko manifest metadata.
- Animated product demo and reusable Chrome/Firefox store-listing copy.

### Changed

- Made the one-permission, zero-network-requests privacy advantage prominent.

## [1.4.0] - 2026-09-10

### Added

- Toolbar popup with a shortcut guide and enabled toggle.
- Branded extension icons for Chrome and GitHub.
- Automated manifest validation and behavior tests.
- GitHub Actions validation for pushes and pull requests.
- MIT license and open-source contribution guidance.

### Changed

- Renamed remaining site-specific identifiers to match the generic extension.
- Added a safe migration for the legacy enabled setting.
- Improved keyboard handling for editable controls.
- Improved popup accessibility for screen-reader users.

## [1.3.0] - 2026-09-09

### Added

- Playback-speed controls from `0.5x` to `4x`.
- Persistent hotkey enable and disable setting.
- On-page feedback for toggle and speed changes.

## [1.0.0] - 2026-09-09

### Added

- Initial Chrome Manifest V3 extension.
- Keyboard shortcuts for seeking HTML5 videos.