// Stages the FFmpeg core runtime as same-origin static files.
//
// The Discord GIF Maker runs this code against visitors' local media, so it must
// come from the pinned @ffmpeg/core package, whose tarball pnpm verifies against
// the lockfile's integrity hash, never from a third-party CDN at runtime.
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { coreSourceDir, coreFiles, ffmpegCoreBasePath } = require('./ffmpeg-core.cjs');

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const stagingRoot = join(frontendRoot, 'public', 'ffmpeg');
const targetDir = join(frontendRoot, 'public', ...ffmpegCoreBasePath.split('/'));

// Drop earlier versions so a stale ~32 MB core never ships in the image.
rmSync(stagingRoot, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
for (const file of coreFiles) {
  copyFileSync(join(coreSourceDir, file), join(targetDir, file));
}
