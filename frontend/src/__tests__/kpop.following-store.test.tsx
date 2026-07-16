import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  FollowingProvider,
  MAX_FOLLOWED_ARTISTS,
  useFollowing,
} from '@/app/kpop/_context/FollowingStore';

const artist = {
  publicId: '048c3d72-5c61-4f2c-9707-e06b0cc1f7f5',
  displayName: 'Example Artist',
};
const caseVariantArtist = {
  publicId: '148c3d72-5c61-4f2c-9707-e06b0cc1f7f5',
  displayName: 'example artist',
};

function FollowingProbe() {
  const { artists, follow, unfollow, isLoaded } = useFollowing();
  return (
    <div>
      <span data-testid='loaded'>{String(isLoaded)}</span>
      <span data-testid='count'>{artists.length}</span>
      <button type='button' onClick={() => follow(artist)}>
        Follow
      </button>
      <button type='button' onClick={() => follow(caseVariantArtist)}>
        Follow case variant
      </button>
      <button type='button' onClick={() => unfollow(artist.publicId)}>
        Unfollow
      </button>
    </div>
  );
}

describe('following store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('persists follows, prevents duplicates, and removes artists', async () => {
    render(
      <FollowingProvider>
        <FollowingProbe />
      </FollowingProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('loaded').textContent).toBe('true')
    );
    fireEvent.click(screen.getByText('Follow'));
    fireEvent.click(screen.getByText('Follow'));
    fireEvent.click(screen.getByText('Follow case variant'));
    expect(screen.getByTestId('count').textContent).toBe('1');

    fireEvent.click(screen.getByText('Unfollow'));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  test('recovers from invalid data and respects the follow limit', async () => {
    localStorage.setItem('mgck:kpop-following:v2', '{invalid json');
    const { unmount } = render(
      <FollowingProvider>
        <FollowingProbe />
      </FollowingProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('loaded').textContent).toBe('true')
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
    unmount();

    localStorage.setItem(
      'mgck:kpop-following:v2',
      JSON.stringify({
        version: 2,
        artists: Array.from({ length: MAX_FOLLOWED_ARTISTS }, (_, index) => ({
          publicId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
          displayName: `Artist ${index}`,
          followedAt: '2026-07-16T12:00:00.000Z',
        })),
        accountUserId: null,
        pending: { additions: [], removals: [] },
      })
    );
    render(
      <FollowingProvider>
        <FollowingProbe />
      </FollowingProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('count').textContent).toBe('250')
    );
    fireEvent.click(screen.getByText('Follow'));
    expect(screen.getByTestId('count').textContent).toBe('250');
  });

  test('migrates v1 local follows without losing artists', async () => {
    localStorage.setItem(
      'mgck:kpop-following:v1',
      JSON.stringify({
        version: 1,
        artists: [{ ...artist, followedAt: '2026-07-16T12:00:00.000Z' }],
      })
    );
    render(
      <FollowingProvider>
        <FollowingProbe />
      </FollowingProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('count').textContent).toBe('1')
    );
    expect(localStorage.getItem('mgck:kpop-following:v1')).toBeNull();
    expect(localStorage.getItem('mgck:kpop-following:v2')).toContain(
      '"version":2'
    );
  });
});
