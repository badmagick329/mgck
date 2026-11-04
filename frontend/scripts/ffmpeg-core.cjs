// Single source of the FFmpeg core's public path, shared by the staging script,
// next.config.js (env inlined into the client and the cache rule) and Jest.
//
// The path carries the installed @ffmpeg/core version so the files can be cached
// as immutable: an upgrade changes the URL instead of relying on revalidation.
// CommonJS so next.config.js can require it synchronously.
/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');
/* eslint-enable @typescript-eslint/no-require-imports */

// The package's exports hide package.json, so locate it from the entry point.
const coreEntry = require.resolve('@ffmpeg/core'); // <pkg>/dist/umd/ffmpeg-core.js
const coreSourceDir = dirname(coreEntry);
const { version } = JSON.parse(
  readFileSync(join(coreSourceDir, '..', '..', 'package.json'), 'utf8')
);
if (typeof version !== 'string' || !/^[0-9A-Za-z.+-]+$/.test(version)) {
  throw new Error(`Unexpected @ffmpeg/core version: ${version}`);
}

module.exports = {
  coreSourceDir,
  coreFiles: ['ffmpeg-core.js', 'ffmpeg-core.wasm'],
  ffmpegCoreBasePath: `/ffmpeg/${version}`,
};
