import { emojifyText, emojisForPack } from '@/lib/emojify';

describe('emojifyText', () => {
  test('chaos mode adds an emoji after every word without collapsing whitespace', () => {
    expect(emojifyText('Hello  world\nagain!', '😀', 'chaos', () => 0)).toBe(
      'Hello 😀  world 😀\nagain! 😀'
    );
  });

  test('balanced mode only changes the selected word positions', () => {
    const random = queuedRandom([0.1, 0.9, 0.2, 0, 0]);

    expect(emojifyText('one two three', '😀 😎', 'balanced', random)).toBe(
      'one 😀 two three 😀'
    );
  });

  test('light mode still adds one emoji when every random check misses', () => {
    const random = queuedRandom([0.9, 0.9, 0.6, 0]);

    expect(emojifyText('one two', '😀', 'light', random)).toBe('one two 😀');
  });

  test('returns the original message when no usable emoji options exist', () => {
    expect(emojifyText('Keep this\nexactly', '   ', 'chaos')).toBe(
      'Keep this\nexactly'
    );
  });

  test('chaos mode adds emojis after punctuation characters', () => {
    expect(emojifyText('H E Y ! ! !', '😀', 'chaos', () => 0)).toBe(
      'H 😀 E 😀 Y 😀 ! 😀 ! 😀 ! 😀'
    );
  });

  test('balanced mode still ignores punctuation-only chunks', () => {
    expect(emojifyText('hello ! !', '😀', 'balanced', () => 0)).toBe(
      'hello 😀 ! !'
    );
  });

  test('accepts single-character custom options', () => {
    expect(emojifyText('hello', 'x', 'chaos', () => 0)).toBe('hello x');
  });

  test('returns an empty result for an empty message', () => {
    expect(emojifyText('', '😀', 'balanced')).toBe('');
  });
});

describe('emojisForPack', () => {
  test('returns curated pack emojis', () => {
    expect(emojisForPack('hearts', '')).toContain('❤️');
  });

  test('returns the saved custom value for the custom pack', () => {
    expect(emojisForPack('custom', '🫡 frog')).toBe('🫡 frog');
  });
});

function queuedRandom(values: number[]) {
  let index = 0;
  return () => values[index++] ?? 0;
}
