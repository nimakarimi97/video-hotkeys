#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

chrome="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
key="$root/privatekey.pem"

if [[ ! -x "$chrome" ]]; then
  echo "Chrome not found at: $chrome (set CHROME_BIN to override)" >&2
  exit 1
fi

if [[ ! -f "$key" ]]; then
  echo "Missing $key. Use the private key matching the dashboard's Verified CRX uploads key." >&2
  exit 1
fi

npm run check

version="$(node -p "require('./manifest.json').version")"
output_dir="$root/dist"
output="$output_dir/video-hotkeys-$version.crx"

package_dir="$(mktemp -d "$root/.cws-package.XXXXXX")"
trap 'rm -rf "$package_dir" "$package_dir.crx"' EXIT

cp manifest.json content.js content-utils.js popup.html popup.css popup.js "$package_dir/"
cp -R icons "$package_dir/"

"$chrome" --pack-extension="$package_dir" --pack-extension-key="$key"

# Chrome writes the CRX beside the package directory once it finishes.
for _ in $(seq 1 30); do
  [[ -f "$package_dir.crx" ]] && break
  sleep 1
done

if [[ ! -f "$package_dir.crx" ]]; then
  echo "Chrome did not create a CRX. Quit Chrome and run this script again." >&2
  exit 1
fi

mkdir -p "$output_dir"
mv "$package_dir.crx" "$output"
echo "Created ${output#"$root/"}. Upload it in the Chrome Web Store Developer Dashboard."
