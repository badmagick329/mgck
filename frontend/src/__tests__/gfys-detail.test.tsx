import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import GfyView from '@/app/gfys/[videoId]/_components/GfyView';
import RelatedGfys from '@/app/gfys/[videoId]/_components/RelatedGfys';
import { GfyDetailResponse } from '@/lib/types/gfys';
jest.mock('../app/gfys/[videoId]/_components/ShareButtons', () => () => (
  <div>Copy actions</div>
));

jest.mock('react-dom/server', () =>
  jest.requireActual('react-dom/server.node')
);

jest.mock('../app/_components/Navbar', () => () => <nav>Site navigation</nav>);
jest.mock('../app/gfys/[videoId]/_components/NavButtons', () => () => (
  <div>Clip navigation</div>
));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('../app/gfys/_context/store', () => ({
  useGfyContext: () => ({
    videoVolume: 0,
    data: { gfys: [] },
    loopAll: false,
    reconcileCurrentGfy: jest.fn(),
  }),
}));
jest.mock('../actions/gfys', () => ({ addGfyView: jest.fn() }));

const detail: GfyDetailResponse = {
  title: '201019 Irene - original Imgur title',
  display_title: 'Irene',
  gfy_title: 'Irene waving at fans',
  gfy_id: 'OriginalGfycatSlug',
  tags: ['Irene', 'Red Velvet'],
  date: '2020-10-19',
  account: 'archive',
  imgur_id: 'imgur123',
  width: 1920,
  height: 1080,
  video_url: 'https://mgck.ink/gfy-videos/imgur123.mp4',
  view_count: 1234,
  related_clips: [
    {
      id: 'canonical-id',
      imgur_id: 'thumbnail-id',
      title: 'Irene smiling',
      tags: ['Irene'],
      date: null,
      width: null,
      height: null,
    },
  ],
};

test('server output includes a visible primary video, poster, and original source metadata', () => {
  const html = renderToString(
    <GfyView params={{ videoId: 'imgur123' }} gfyDetail={detail} />
  );
  const document = new DOMParser().parseFromString(html, 'text/html');
  const video = document.querySelector('video')!;
  expect(video).not.toBeNull();
  expect(video.getAttribute('poster')).toBe(
    'https://mgck.ink/gfy-thumbnails/imgur123.webp'
  );
  expect(video.className).not.toContain('hidden');
  expect(video.querySelector('source')?.getAttribute('src')).toBe(
    detail.video_url
  );
  expect(document.querySelector('h1')?.textContent).toBe('Irene');
  expect(document.body.textContent).toContain(
    'Original Gfycat title: Irene waving at fans'
  );
  expect(document.body.textContent).toContain(
    'Original Gfycat slug: OriginalGfycatSlug'
  );
  expect(document.body.textContent).toContain(
    'Imgur title: 201019 Irene - original Imgur title'
  );
  expect(document.body.textContent).toContain('1,234');
});

test('related clips link directly to canonical IDs and use the matching thumbnail', () => {
  render(<RelatedGfys clips={detail.related_clips} />);
  expect(
    screen.getByRole('link', { name: 'Irene smiling' }).getAttribute('href')
  ).toBe('/gfys/canonical-id');
  expect(
    screen
      .getByRole('link', { name: 'Irene smiling' })
      .querySelector('img')
      ?.getAttribute('src')
  ).toBe('https://mgck.ink/gfy-thumbnails/thumbnail-id.webp');
});

test('no related section is rendered without shared-tag clips', () => {
  const { container } = render(<RelatedGfys clips={[]} />);
  expect(container.innerHTML).toBe('');
});

test('a new clip prop replaces source details without stale state', () => {
  const { rerender } = render(
    <GfyView params={{ videoId: 'imgur123' }} gfyDetail={detail} />
  );
  rerender(
    <GfyView
      params={{ videoId: 'second' }}
      gfyDetail={{
        ...detail,
        display_title: 'Seulgi',
        gfy_title: 'Seulgi dancing',
        gfy_id: null,
      }}
    />
  );
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Seulgi');
  expect(screen.queryByText('Irene waving at fans')).toBeNull();
  expect(screen.queryByText('OriginalGfycatSlug')).toBeNull();
});
