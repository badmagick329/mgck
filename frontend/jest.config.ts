import type { Config } from 'jest';
import nextJest from 'next/jest.js';

import ffmpegCore from './scripts/ffmpeg-core.cjs';

// next/jest loads .env files but not next.config.js `env`; mirror that value so
// FFmpegManager resolves the same versioned core path as the build. Workers
// inherit it from this process.
process.env.FFMPEG_CORE_BASE_PATH = ffmpegCore.ffmpegCoreBasePath;

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  preset: 'ts-jest',
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
