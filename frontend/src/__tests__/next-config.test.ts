/**
 * @jest-environment node
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS config
const nextConfig = require('../../next.config.js');

const GOOGLEBOT_SMARTPHONE_UA =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

describe('next.config.js', () => {
  test('renders metadata in <head> for Googlebot', () => {
    expect(nextConfig.htmlLimitedBots).toBeInstanceOf(RegExp);
    expect(nextConfig.htmlLimitedBots.test(GOOGLEBOT_SMARTPHONE_UA)).toBe(true);
  });
});
