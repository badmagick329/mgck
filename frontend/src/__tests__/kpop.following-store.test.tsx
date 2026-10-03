import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  getAccountFollowing,
  mergeAccountFollowing,
  addAccountFollowing,
  removeAccountFollowing,
} from '@/actions/kpop-following';
jest.mock('../actions/kpop-following', () => ({
  getAccountFollowing: jest.fn(),
  mergeAccountFollowing: jest.fn(),
  addAccountFollowing: jest.fn(),
  removeAccountFollowing: jest.fn(),
}));

import {
  FollowingProvider,
  MAX_FOLLOWED_ARTISTS,
  useFollowing,
  followingAccountStorageKey,
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
  const {
    artists,
    follow,
    unfollow,
    isLoaded,
    preferences,
    setLookbackDays,
    setOrdering,
  } = useFollowing();
  return (
    <div>
      <span data-testid='loaded'>{String(isLoaded)}</span>
      <span data-testid='count'>{artists.length}</span>
      <span data-testid='names'>
        {artists.map((artist) => artist.displayName).join(',')}
      </span>
      <span data-testid='preferences'>{JSON.stringify(preferences)}</span>
      <button type='button' onClick={() => follow(artist)}>
        Follow
      </button>
      <button type='button' onClick={() => follow(caseVariantArtist)}>
        Follow case variant
      </button>
      <button type='button' onClick={() => unfollow(artist.publicId)}>
        Unfollow
      </button>
      <button type='button' onClick={() => setLookbackDays(90)}>
        Set 90 days
      </button>
      <button type='button' onClick={() => setOrdering('recent_first')}>
        Set newest first
      </button>
    </div>
  );
}

describe('following store', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.mocked(getAccountFollowing).mockResolvedValue({ type: 'error' });
  });

  test('persists follows, prevents duplicates, and removes artists', async () => {
    render(
      <FollowingProvider accountUserId={null}>
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
    localStorage.setItem('mgck:kpop-following:v3', '{invalid json');
    const { unmount } = render(
      <FollowingProvider accountUserId={null}>
        <FollowingProbe />
      </FollowingProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('loaded').textContent).toBe('true')
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
    unmount();

    localStorage.setItem(
      'mgck:kpop-following:anonymous:v4',
      JSON.stringify({
        version: 3,
        artists: Array.from({ length: MAX_FOLLOWED_ARTISTS }, (_, index) => ({
          publicId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
          displayName: `Artist ${index}`,
          followedAt: '2026-07-16T12:00:00.000Z',
        })),
        accountUserId: null,
        pending: { additions: [], removals: [] },
        preferences: { lookbackDays: 30, ordering: 'upcoming_first' },
      })
    );
    render(
      <FollowingProvider accountUserId={null}>
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
      <FollowingProvider accountUserId={null}>
        <FollowingProbe />
      </FollowingProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('count').textContent).toBe('1')
    );
    expect(localStorage.getItem('mgck:kpop-following:v1')).toBeNull();
    expect(localStorage.getItem('mgck:kpop-following:anonymous:v4')).toContain(
      '"version":3'
    );
  });

  test('migrates v2 follows and persists timeline preferences', async () => {
    localStorage.setItem(
      'mgck:kpop-following:v2',
      JSON.stringify({
        version: 2,
        artists: [{ ...artist, followedAt: '2026-07-16T12:00:00.000Z' }],
        accountUserId: null,
        pending: { additions: [], removals: [] },
      })
    );
    render(
      <FollowingProvider accountUserId={null}>
        <FollowingProbe />
      </FollowingProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('preferences').textContent).toBe(
        '{"lookbackDays":30,"ordering":"upcoming_first"}'
      )
    );
    expect(localStorage.getItem('mgck:kpop-following:v2')).toBeNull();

    fireEvent.click(screen.getByText('Set 90 days'));
    fireEvent.click(screen.getByText('Set newest first'));
    expect(screen.getByTestId('preferences').textContent).toBe(
      '{"lookbackDays":90,"ordering":"recent_first"}'
    );
    expect(localStorage.getItem('mgck:kpop-following:anonymous:v4')).toContain(
      '"lookbackDays":90'
    );
  });

  const cachedStore = (
    accountUserId: string | null,
    name = artist.displayName
  ) => ({
    version: 3,
    accountUserId,
    artists: [
      { ...artist, displayName: name, followedAt: '2026-07-16T12:00:00.000Z' },
    ],
    pending: { additions: [artist.publicId], removals: [] },
    preferences: { lookbackDays: 90, ordering: 'recent_first' },
  });

  test('logout and A-to-B switches preserve A pending edits without exposing or merging them', async () => {
    localStorage.setItem(
      'mgck:kpop-following:v3',
      JSON.stringify(cachedStore('alice', 'Alice private'))
    );
    const view = render(
      <FollowingProvider accountUserId='alice'>
        <FollowingProbe />
      </FollowingProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('names').textContent).toBe('Alice private')
    );
    view.rerender(
      <FollowingProvider accountUserId={null}>
        <FollowingProbe />
      </FollowingProvider>
    );
    expect(screen.getByTestId('names').textContent).toBe('');
    await waitFor(() =>
      expect(screen.getByTestId('loaded').textContent).toBe('true')
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
    jest
      .mocked(getAccountFollowing)
      .mockResolvedValue({ type: 'ok', data: { userId: 'bob', artists: [] } });
    view.rerender(
      <FollowingProvider accountUserId='bob'>
        <FollowingProbe />
      </FollowingProvider>
    );
    await waitFor(() => expect(getAccountFollowing).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(mergeAccountFollowing).not.toHaveBeenCalled();
    expect(addAccountFollowing).not.toHaveBeenCalled();
    expect(
      JSON.parse(localStorage.getItem(followingAccountStorageKey('alice'))!)
        .pending.additions
    ).toEqual([artist.publicId]);
    view.rerender(
      <FollowingProvider accountUserId='alice'>
        <FollowingProbe />
      </FollowingProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('names').textContent).toBe('Alice private')
    );
  });

  test('anonymous follows import once into the signed-in account', async () => {
    localStorage.setItem(
      'mgck:kpop-following:v3',
      JSON.stringify(cachedStore(null))
    );
    const account = {
      userId: 'alice',
      artists: [
        {
          artistPublicId: artist.publicId,
          displayName: artist.displayName,
          createdAt: '2026-07-16T12:00:00.000Z',
        },
      ],
    };
    jest.mocked(getAccountFollowing).mockResolvedValue({
      type: 'ok',
      data: { userId: 'alice', artists: [] },
    });
    jest
      .mocked(mergeAccountFollowing)
      .mockResolvedValue({ type: 'ok', data: account });
    const view = render(
      <FollowingProvider accountUserId='alice'>
        <FollowingProbe />
      </FollowingProvider>
    );
    await waitFor(() =>
      expect(mergeAccountFollowing).toHaveBeenCalledWith(
        expect.any(Array),
        'alice'
      )
    );
    await waitFor(() =>
      expect(
        localStorage.getItem('mgck:kpop-following:anonymous:v4')
      ).toBeNull()
    );
    view.rerender(
      <FollowingProvider accountUserId={null}>
        <FollowingProbe />
      </FollowingProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('loaded').textContent).toBe('true')
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(
      JSON.parse(localStorage.getItem(followingAccountStorageKey('alice'))!)
        .artists
    ).toHaveLength(1);
  });

  test('late A response cannot replace the selected B cache', async () => {
    let resolve!: (
      value: Awaited<ReturnType<typeof getAccountFollowing>>
    ) => void;
    jest.mocked(getAccountFollowing).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    const view = render(
      <FollowingProvider accountUserId='alice'>
        <FollowingProbe />
      </FollowingProvider>
    );
    await waitFor(() => expect(getAccountFollowing).toHaveBeenCalledTimes(1));
    view.rerender(
      <FollowingProvider accountUserId='bob'>
        <FollowingProbe />
      </FollowingProvider>
    );
    await act(async () =>
      resolve({
        type: 'ok',
        data: {
          userId: 'alice',
          artists: [
            {
              artistPublicId: artist.publicId,
              displayName: 'Alice private',
              createdAt: '2026-07-16T12:00:00.000Z',
            },
          ],
        },
      })
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(
      JSON.parse(localStorage.getItem(followingAccountStorageKey('bob'))!)
        .artists
    ).toEqual([]);
  });

  test('an unfollow made during an in-flight addition survives the stale response', async () => {
    jest
      .mocked(getAccountFollowing)
      .mockResolvedValue({
        type: 'ok',
        data: { userId: 'alice', artists: [] },
      });
    let resolve!: (
      value: Awaited<ReturnType<typeof addAccountFollowing>>
    ) => void;
    jest.mocked(addAccountFollowing).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    jest
      .mocked(removeAccountFollowing)
      .mockResolvedValue({
        type: 'ok',
        data: { userId: 'alice', artists: [] },
      });
    render(
      <FollowingProvider accountUserId='alice'>
        <FollowingProbe />
      </FollowingProvider>
    );
    await waitFor(() => expect(getAccountFollowing).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText('Follow'));
    await waitFor(() =>
      expect(addAccountFollowing).toHaveBeenCalledWith(
        expect.any(Object),
        'alice'
      )
    );
    fireEvent.click(screen.getByText('Unfollow'));
    await act(async () =>
      resolve({
        type: 'ok',
        data: {
          userId: 'alice',
          artists: [
            {
              artistPublicId: artist.publicId,
              displayName: artist.displayName,
              createdAt: '2026-07-16T12:00:00.000Z',
            },
          ],
        },
      })
    );
    await waitFor(() =>
      expect(removeAccountFollowing).toHaveBeenCalledWith(
        artist.publicId,
        'alice'
      )
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(followingAccountStorageKey('alice'))!)
          .pending
      ).toEqual({ additions: [], removals: [] })
    );
  });
});
