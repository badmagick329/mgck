jest.mock('../lib/utils', () => ({
  ...jest.requireActual('../lib/utils'),
  handleCopyToClipboard: jest.fn(),
}));
jest.mock('../actions/gfys', () => ({ addGfyView: jest.fn() }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
const goToNextGfy = jest.fn();
jest.mock('../app/gfys/_context/store', () => ({
  useGfyContext: () => ({
    videoVolume: 0,
    setVideoVolume: jest.fn(),
    goToNextGfy,
    goToPreviousGfy: jest.fn(),
    data: { gfys: [] },
    loopAll: false,
  }),
}));

import GfyPlayer from '@/app/gfys/[videoId]/_components/GfyPlayer';
import ShareButtons from '@/app/gfys/[videoId]/_components/ShareButtons';
import { isShortcutBlocked } from '@/lib/gfys/keyboard';
import { handleCopyToClipboard } from '@/lib/utils';
import { fireEvent, render, screen } from '@testing-library/react';

function keydownOn(target: Element, init: KeyboardEventInit) {
  let event: KeyboardEvent | undefined;
  target.addEventListener('keydown', (e) => (event = e as KeyboardEvent), {
    once: true,
  });
  fireEvent.keyDown(target, init);
  return event!;
}

describe('isShortcutBlocked', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function element(html: string, selector: string) {
    document.body.innerHTML = html;
    return document.querySelector(selector)!;
  }

  it.each([
    ['<input />', 'input'],
    ['<textarea></textarea>', 'textarea'],
    ['<select><option>a</option></select>', 'select'],
    ['<div contenteditable="true"><span>x</span></div>', 'span'],
    ['<div contenteditable=""></div>', 'div'],
  ])('blocks every key in text entry %s', (html, selector) => {
    const target = element(html, selector);
    for (const key of ['i', 'ArrowRight', ' ']) {
      expect(isShortcutBlocked(keydownOn(target, { key }))).toBe(true);
    }
  });

  it.each([
    ['<button><span>x</span></button>', 'span'],
    ['<a href="/gfys"><span>x</span></a>', 'span'],
  ])(
    'lets a focused control keep only its activation keys %s',
    (html, selector) => {
      const target = element(html, selector);
      expect(isShortcutBlocked(keydownOn(target, { key: ' ' }))).toBe(true);
      expect(isShortcutBlocked(keydownOn(target, { key: 'Enter' }))).toBe(true);
      expect(isShortcutBlocked(keydownOn(target, { key: 'ArrowRight' }))).toBe(
        false
      );
      expect(isShortcutBlocked(keydownOn(target, { key: 'i' }))).toBe(false);
    }
  );

  it('allows plain keys on the page and blocks modified ones', () => {
    expect(isShortcutBlocked(keydownOn(document.body, { key: 'i' }))).toBe(
      false
    );
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
      expect(
        isShortcutBlocked(
          keydownOn(document.body, { key: 'i', [modifier]: true })
        )
      ).toBe(true);
    }
  });

  it('ignores an event another handler already consumed', () => {
    document.body.addEventListener('keydown', (e) => e.preventDefault(), {
      once: true,
    });
    expect(isShortcutBlocked(keydownOn(document.body, { key: 'i' }))).toBe(
      true
    );
  });
});

describe('Gfys shortcuts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('copies the Imgur link on i, but not while typing in a field', () => {
    render(
      <>
        <input aria-label='search' />
        <ShareButtons imgurId='abc' videoUrl='https://imgur.com/abc.mp4' />
      </>
    );

    fireEvent.keyDown(screen.getByLabelText('search'), { key: 'i' });
    expect(handleCopyToClipboard).not.toHaveBeenCalled();

    fireEvent.keyDown(document.body, { key: 'i' });
    expect(handleCopyToClipboard).toHaveBeenCalledWith(
      'https://imgur.com/abc.mp4',
      expect.any(Function)
    );
  });

  it('leaves arrow keys to the nav buttons so one press moves one clip', () => {
    render(
      <GfyPlayer
        videoUrl='https://example.com/v.mp4'
        poster='https://example.com/poster.webp'
      />
    );

    fireEvent.keyDown(document.body, { key: 'ArrowRight' });

    expect(goToNextGfy).not.toHaveBeenCalled();
  });

  it('copies each labelled source by click and by its existing shortcut', () => {
    render(
      <ShareButtons
        imgurId='abc'
        videoUrl='https://mgck.ink/gfy-videos/abc.mp4'
      />
    );
    const imgur = screen.getByRole('button', { name: 'Copy Imgur video link' });
    const hq = screen.getByRole('button', { name: 'Copy HQ video link' });

    fireEvent.click(imgur);
    fireEvent.keyDown(document.body, { key: 'i' });
    fireEvent.click(hq);
    fireEvent.keyDown(document.body, { key: 'q' });

    expect(
      (handleCopyToClipboard as jest.Mock).mock.calls.map(([url]) => url)
    ).toEqual([
      'https://imgur.com/abc.mp4',
      'https://imgur.com/abc.mp4',
      'https://mgck.ink/gfy-videos/abc.mp4',
      'https://mgck.ink/gfy-videos/abc.mp4',
    ]);
  });

  it('omits the HQ copy action when Imgur is the only source', () => {
    render(
      <ShareButtons imgurId='abc' videoUrl='https://i.imgur.com/abc.mp4' />
    );
    expect(
      screen.queryByRole('button', { name: 'Copy HQ video link' })
    ).toBeNull();
    fireEvent.keyDown(document.body, { key: 'q' });
    expect(handleCopyToClipboard).not.toHaveBeenCalled();
  });
});
