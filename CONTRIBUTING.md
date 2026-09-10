# Contributing

Thanks for helping improve Video Hotkeys. Focused bug fixes, compatibility improvements, accessibility work, and clear documentation changes are welcome.

## Before You Start

- Search existing issues before opening a new one.
- Open an issue before beginning a large behavior or shortcut change.
- Keep permissions minimal. New permissions need a clear user benefit and privacy justification.
- Do not add analytics, remote code, or unnecessary dependencies.

## Local Workflow

1. Fork and clone the repository.
2. Load the project with **Load unpacked** at `chrome://extensions`.
3. Make one focused change.
4. Run the quality gate:

   ```bash
   npm run check
   ```

5. Reload the extension and manually test the affected shortcut on at least one page with an HTML5 video.

## Pull Requests

- Explain the user-facing problem and the chosen solution.
- Add or update tests when behavior changes.
- Update the README or changelog when users need to know about the change.
- Keep unrelated formatting and refactors out of the pull request.
- Confirm that no secrets, packaged extensions, or private keys are included.

By contributing, you agree that your contribution is licensed under the MIT License.