# Privacy Policy for Video Hotkeys

**Last updated:** October 14, 2026

Video Hotkeys ("the extension") is developed by Nima Karimi. This Privacy Policy describes how the extension handles user information.

## 1. Information Collection and Use

Video Hotkeys does not collect, log, track, transmit, sell, or share any personal data, browsing activity, or user information.

The extension operates entirely client-side within your browser and makes zero network requests.

## 2. Storage Permissions

The extension requests a single browser permission: `storage`. This permission is used exclusively to store your personal playback preferences locally on your device:

- Extension enabled/disabled state (`videoHotkeysEnabled`)
- Preferred short seek duration in seconds (`shortSeekSeconds`)
- Preferred long seek duration in seconds (`longSeekSeconds`)

This configuration data is stored locally via the browser's WebExtensions storage API (`chrome.storage.local`) and is never transmitted to any external server.

## 3. Host Permissions (Content Scripts)

Video Hotkeys injects a content script across web pages solely to detect HTML5 `<video>` elements and respond to user-triggered keyboard shortcuts (e.g., seeking, speed change, volume adjustment, Picture-in-Picture). It does not inspect, read, or transmit any web page content or credentials.

## 4. Third-Party Services and Analytics

The extension contains no third-party libraries, tracking pixels, ads, analytics scripts, or remote code execution.

## 5. Contact

If you have questions about this privacy policy, please contact:
- Website: [https://nimakarimi.me](https://nimakarimi.me)
- Repository: [https://github.com/nimakarimi97/video-hotkeys](https://github.com/nimakarimi97/video-hotkeys)
