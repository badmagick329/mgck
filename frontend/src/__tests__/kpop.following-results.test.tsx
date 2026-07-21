import { render, waitFor } from '@testing-library/react';

import FollowingKpopResults from '@/app/kpop/_components/FollowingKpopResults';
import { FollowingProvider } from '@/app/kpop/_context/FollowingStore';
import { fetchWatchlistComebacks } from '../lib/kpop';

jest.mock('../actions/kpop-following', () => ({
  getAccountFollowing: jest.fn(),
  mergeAccountFollowing: jest.fn(),
  addAccountFollowing: jest.fn(),
  removeAccountFollowing: jest.fn(),
}));
jest.mock('../lib/kpop', () => ({
  fetchWatchlistComebacks: jest.fn(),
}));
jest.mock('lucide-react', () => ({
  Loader2: () => null,
}));

const artist = {
  publicId: '048c3d72-5c61-4f2c-9707-e06b0cc1f7f5',
  displayName: 'Example Artist',
  followedAt: '2026-07-16T12:00:00.000Z',
};
const accountArtist = {
  artistPublicId: artist.publicId,
  displayName: artist.displayName,
  createdAt: artist.followedAt,
};

describe('following timeline loading', () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem(
      'mgck:kpop-following:v3',
      JSON.stringify({
        version: 3,
        artists: [artist],
        accountUserId: 'account-user',
        pending: { additions: [], removals: [] },
        preferences: { lookbackDays: 30, ordering: 'upcoming_first' },
      })
    );
    const followingActions = await import('../actions/kpop-following');
    jest.mocked(followingActions.getAccountFollowing).mockResolvedValue({
      type: 'ok',
      data: { userId: 'account-user', artists: [accountArtist] },
    });
    jest.mocked(fetchWatchlistComebacks).mockResolvedValue({
      count: 0,
      previous: null,
      next: null,
      total_pages: 0,
      results: [],
    });
  });

  test('does not restart an unchanged initial watchlist request after account sync', async () => {
    render(
      <FollowingProvider>
        <FollowingKpopResults />
      </FollowingProvider>
    );

    await waitFor(() => expect(fetchWatchlistComebacks).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(fetchWatchlistComebacks).toHaveBeenCalledTimes(1));
  });
});
