import '@testing-library/jest-dom';

import { render, screen, within } from '@testing-library/react';

import KpopResults from '@/app/kpop/_components/KpopResults';
import { groupComebacksByDate } from '@/lib/kpop/results';
import { ComebackResponse } from '@/lib/types/kpop';

jest.mock('../app/kpop/_components/FollowArtistButton', () => ({
  __esModule: true,
  default: ({ displayName }: { displayName: string }) => (
    <button type='button'>Follow {displayName}</button>
  ),
}));

jest.mock('../app/kpop/_components/ComebackLinks', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <a href='#watch'>Watch {title}</a>,
}));

const comebacks: ComebackResponse[] = [
  comeback({ id: 1, date: '2026-08-30', artist: 'Artist One' }),
  comeback({ id: 2, date: '2026-08-30', artist: 'Artist Two' }),
  comeback({ id: 3, date: '2026-08-31', artist: 'Artist Three' }),
];

describe('K-pop result layouts', () => {
  test('groups releases by date without changing their order', () => {
    expect(groupComebacksByDate(comebacks)).toEqual([
      { date: '2026-08-30', comebacks: comebacks.slice(0, 2) },
      { date: '2026-08-31', comebacks: comebacks.slice(2) },
    ]);
  });

  test('renders a desktop table and a compact mobile feed from the same groups', () => {
    render(<KpopResults comebacks={comebacks} />);

    const table = screen.getByRole('table', {
      name: 'K-pop comeback releases',
    });
    expect(within(table).getByText('Artist One')).toBeInTheDocument();
    expect(within(table).getByText('Artist Three')).toBeInTheDocument();

    const compactFeed = screen.getByRole('region', {
      name: 'K-pop comeback releases, compact view',
    });
    expect(within(compactFeed).getByText('Artist Two')).toBeInTheDocument();
    expect(within(compactFeed).getAllByRole('listitem')).toHaveLength(3);
  });
});

function comeback({
  id,
  date,
  artist,
}: {
  id: number;
  date: string;
  artist: string;
}): ComebackResponse {
  return {
    id,
    date,
    artist,
    artist_public_id: '048c3d72-5c61-4f2c-9707-e06b0cc1f7f5',
    title: `Title ${id}`,
    album: `Album ${id}`,
    release_type: 'digital single',
    urls: [],
    spotify_urls: [],
    apple_music_urls: [],
  };
}
