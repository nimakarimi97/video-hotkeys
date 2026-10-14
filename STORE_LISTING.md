# Video Hotkeys Store Listing

## Short Description

Control the video you're watching with private, customizable keyboard shortcuts. One permission, zero network requests.

## Full Description

Video Hotkeys gives you fast, lightweight keyboard controls for HTML5 videos across the web in Chrome and Firefox.

Control the video you're watching without clicking the player controls. Seek forward and backward with arrow keys, change playback speed, toggle Picture-in-Picture (PiP), switch fullscreen, and adjust volume. It automatically targets the active or playing video, even on pages with multiple videos, iframes, or open shadow DOM components.

Short and long seek intervals are fully customizable, with useful 5 and 15 second defaults, accompanied by clear on-screen display (OSD) feedback.

Privacy is deliberately simple: one local-storage permission and zero network requests. Video Hotkeys has no analytics, tracking, remote code, account, or data collection. Your preferences stay entirely in your browser.

Highlights:

- Smart targeting: Automatically controls the currently playing video
- Custom seek intervals: Configurable short and long seek steps (default 5s & 15s)
- On-Screen Display (OSD): Visual badges for seeking, speed, volume, and status
- Playback speed: Fine-tune from 0.5x to 4x in 0.25x steps
- Picture-in-Picture (PiP): Instant toggle with P
- Fullscreen mode: One-key toggle with F
- Volume & Mute: Adjust with Shift + Up/Down, mute with M
- Embedded video support: Works across iframes and shadow DOM
- 100% Private: 1 permission (`storage`), zero analytics, zero network requests

Shortcuts:

- Forward / Back (Short): Right Arrow / Left Arrow
- Forward / Back (Long): Cmd/Ctrl + Right Arrow / Left Arrow
- Speed Up / Down: Shift + > / Shift + <
- Reset Speed: Shift + ?
- Picture-in-Picture: P
- Fullscreen: F
- Volume Up / Down: Shift + Up / Shift + Down
- Mute / Unmute: M
- Toggle Hotkeys On/Off: Ctrl + Shift + U

## Demo

![Animated demo of active-video selection, custom seeking, playback speed, and privacy](assets/video-hotkeys-demo.gif)

Use the animated demo as the first supported media item. Where a store accepts only static screenshots, use representative frames from the same animation followed by `assets/popup-preview.png`.

## Privacy Disclosure

Video Hotkeys does not collect, transmit, sell, or share user data. The extension stores only its enabled state and the user's short and long seek intervals through the browser's local WebExtensions storage API.