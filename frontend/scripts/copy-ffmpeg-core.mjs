// Stages the FFmpeg core runtime as same-origin static files.
//
// The Discord GIF Maker runs this code against visitors' local media, so it must
// come from the pinned @ffmpeg/core package, whose tarball pnpm verifies against
// the lockfile's integrity hash, never from a third-party CDN at runtime.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(frontendRoot, 'package.json'));
const sourceDir = dirname(require.resolve('@ffmpeg/core')); // dist/umd
const targetDir = join(frontendRoot, 'public', 'ffmpeg');

mkdirSync(targetDir, { recursive: true });
for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  copyFileSync(join(sourceDir, file), join(targetDir, file));
}
