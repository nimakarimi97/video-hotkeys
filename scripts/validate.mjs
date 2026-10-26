import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readProjectFile = (file) => readFile(path.join(root, file));
const manifest = JSON.parse(await readProjectFile('manifest.json'));

assert.equal(manifest.manifest_version, 3, 'manifest_version must be 3');
assert.match(manifest.version, /^\d+(?:\.\d+){0,3}$/, 'version must use Chrome version syntax');
assert.ok(manifest.description.length <= 132, 'description must be at most 132 characters');
assert.deepEqual(manifest.permissions, ['storage'], 'extension should request only storage permission');
assert.ok(
  manifest.content_scripts.some((script) => script.run_at === 'document_start'),
  'content scripts must register before page scripts can capture keyboard shortcuts'
);
assert.deepEqual(
  manifest.browser_specific_settings?.gecko?.data_collection_permissions?.required,
  ['none'],
  'Firefox manifest must declare that no data is collected'
);

const referencedFiles = new Set([manifest.action.default_popup]);

for (const icon of Object.values(manifest.icons ?? {})) referencedFiles.add(icon);
for (const icon of Object.values(manifest.action.default_icon ?? {})) referencedFiles.add(icon);
for (const script of manifest.content_scripts ?? []) {
  for (const file of [...(script.js ?? []), ...(script.css ?? [])]) referencedFiles.add(file);
}

for (const file of referencedFiles) {
  assert.ok(file, 'manifest references must not be empty');
  assert.ok((await stat(path.join(root, file))).isFile(), `missing manifest asset: ${file}`);
}

for (const [size, file] of Object.entries(manifest.icons ?? {})) {
  const png = await readProjectFile(file);
  assert.equal(png.subarray(1, 4).toString(), 'PNG', `${file} must be a PNG`);
  assert.equal(png.readUInt32BE(16), Number(size), `${file} has the wrong width`);
  assert.equal(png.readUInt32BE(20), Number(size), `${file} has the wrong height`);
}

const popup = (await readProjectFile(manifest.action.default_popup)).toString();
const localAssets = [
  ...popup.matchAll(/<script[^>]+src="([^"]+)"/g),
  ...popup.matchAll(/<link[^>]+href="([^"]+)"/g)
].map((match) => match[1]);

for (const file of localAssets) {
  assert.ok(!/^https?:/.test(file), 'popup assets must be packaged locally');
  assert.ok((await stat(path.join(root, file))).isFile(), `missing popup asset: ${file}`);
}

const demo = await readProjectFile('assets/video-hotkeys-demo.gif');
assert.equal(demo.subarray(0, 3).toString(), 'GIF', 'README demo must be a GIF');

console.log(`Validated manifest ${manifest.version} and ${referencedFiles.size} packaged assets.`);