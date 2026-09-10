# Video Hotkeys (Chrome Extension)

## What it does
- `ArrowRight` skips the active page video forward by 5 seconds.
- On macOS, `Command+Right Arrow` skips forward 15 seconds and `Command+Left Arrow` skips backward 15 seconds.
- On Windows, `Ctrl+Right Arrow` skips forward 15 seconds and `Ctrl+Left Arrow` skips backward 15 seconds.
- Runs on HTTP and HTTPS websites containing a `<video>` element.
- Toggle hotkey behavior on/off with `Ctrl+Shift+U`.
- `Shift+>` increases speed by `0.25` (max `4.0x`).
- `Shift+<` decreases speed by `0.25` (min `0.5x`).
- `Shift+?` resets speed to `1.0x`.

## Load in Chrome
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.

## Use it in Chrome
1. Open Chrome and pin the extension to the toolbar by clicking the puzzle icon and selecting this extension.
2. Go to any page with a playable video.
3. Click the video once so it is active, then use the hotkeys:
   - `Right Arrow`: skip forward 5 seconds
   - `Ctrl/Cmd + Right Arrow`: skip forward 15 seconds
   - `Ctrl/Cmd + Left Arrow`: skip backward 15 seconds
   - `Shift + >`: increase playback speed
   - `Shift + <`: decrease playback speed
   - `Shift + ?`: reset speed to `1.0x`
4. If you want to disable the hotkeys temporarily, press `Ctrl + Shift + U`.
5. A small status badge appears on the page to confirm whether hotkeys are on or off.

> The extension does not open a popup when you click it. It runs in the page itself, so the main action is using the shortcut keys while the video is playing.

## Notes
- Chrome requires the extension to be reloaded from `chrome://extensions` after changing `manifest.json`.
- It uses `chrome.storage` to remember whether the hotkey toggle is on or off.
