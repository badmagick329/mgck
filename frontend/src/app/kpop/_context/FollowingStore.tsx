'use client';

import {
  addAccountFollowing,
  getAccountFollowing,
  mergeAccountFollowing,
  removeAccountFollowing,
} from '@/actions/kpop-following';
import { toast } from '@/components/ui/use-toast';
import { AccountFollowing } from '@/lib/types/kpop-following';
import { z } from 'zod';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const STORAGE_KEY = 'mgck:kpop-following:v2';
const LEGACY_STORAGE_KEY = 'mgck:kpop-following:v1';
export const MAX_FOLLOWED_ARTISTS = 250;

const FollowedArtistSchema = z.object({
  publicId: z.string().uuid(),
  displayName: z.string().min(1),
  followedAt: z.string().datetime(),
});
const PendingChangesSchema = z.object({
  additions: z.array(z.string().uuid()).max(MAX_FOLLOWED_ARTISTS),
  removals: z.array(z.string().uuid()).max(MAX_FOLLOWED_ARTISTS),
});
const FollowingStoreSchema = z.object({
  version: z.literal(2),
  artists: z.array(FollowedArtistSchema).max(MAX_FOLLOWED_ARTISTS),
  accountUserId: z.string().min(1).nullable(),
  pending: PendingChangesSchema,
});
const LegacyFollowingStoreSchema = z.object({
  version: z.literal(1),
  artists: z.array(FollowedArtistSchema).max(MAX_FOLLOWED_ARTISTS),
});

export type FollowedArtist = z.infer<typeof FollowedArtistSchema>;
type FollowingStore = z.infer<typeof FollowingStoreSchema>;
type FollowResult = 'added' | 'already-following' | 'limit-reached';

type FollowingContextValue = {
  artists: FollowedArtist[];
  isLoaded: boolean;
  isManagerOpen: boolean;
  follow: (artist: { publicId: string; displayName: string }) => FollowResult;
  unfollow: (publicId: string, displayName?: string) => void;
  isFollowing: (publicId: string, displayName?: string) => boolean;
  openManager: () => void;
  setManagerOpen: (open: boolean) => void;
};

const FollowingContext = createContext<FollowingContextValue | undefined>(
  undefined
);
const initialStore: FollowingStore = {
  version: 2,
  artists: [],
  accountUserId: null,
  pending: { additions: [], removals: [] },
};

export function FollowingProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<FollowingStore>(initialStore);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isManagerOpen, setManagerOpen] = useState(false);
  const storeRef = useRef(store);
  const showedSyncWarning = useRef(false);

  const persistStore = useCallback((nextStore: FollowingStore) => {
    storeRef.current = nextStore;
    setStore(nextStore);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
    } catch {
      toast({
        title: 'Could not save followed artists',
        description: 'Your latest changes may not survive a refresh.',
        variant: 'destructive',
      });
    }
  }, []);

  const warnSync = useCallback((description: string) => {
    if (showedSyncWarning.current) {
      return;
    }
    showedSyncWarning.current = true;
    toast({
      title: 'Following is not synced',
      description,
      variant: 'destructive',
    });
  }, []);

  useEffect(() => {
    try {
      const savedStore = localStorage.getItem(STORAGE_KEY);
      const parsedStore = savedStore
        ? FollowingStoreSchema.safeParse(JSON.parse(savedStore))
        : null;
      if (parsedStore?.success) {
        persistStore(parsedStore.data);
      } else {
        const legacyStore = localStorage.getItem(LEGACY_STORAGE_KEY);
        const parsedLegacy = legacyStore
          ? LegacyFollowingStoreSchema.safeParse(JSON.parse(legacyStore))
          : null;
        if (parsedLegacy?.success) {
          persistStore({ ...initialStore, artists: parsedLegacy.data.artists });
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } else if (savedStore || legacyStore) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, [persistStore]);

  const applyAccount = useCallback(
    (
      account: AccountFollowing,
      pending: FollowingStore['pending'] = { additions: [], removals: [] }
    ) => {
      const localArtists = storeRef.current.artists;
      const pendingArtists = localArtists.filter((artist) =>
        pending.additions.includes(artist.publicId)
      );
      const artists = dedupeArtists([
        ...account.artists.map((artist) => ({
          publicId: artist.artistPublicId,
          displayName: artist.displayName,
          followedAt: artist.createdAt,
        })),
        ...pendingArtists,
      ]).filter((artist) => !pending.removals.includes(artist.publicId));
      persistStore({
        version: 2,
        artists,
        accountUserId: account.userId,
        pending,
      });
    },
    [persistStore]
  );

  const syncAccount = useCallback(async () => {
    const accountResult = await getAccountFollowing();
    if (accountResult.type === 'unauthenticated') {
      return;
    }
    if (accountResult.type !== 'ok') {
      warnSync('Changes will be retried the next time you visit K-pop.');
      return;
    }

    const current = storeRef.current;
    if (current.accountUserId !== accountResult.data.userId) {
      const artists = dedupeArtists([
        ...current.artists,
        ...accountResult.data.artists.map((artist) => ({
          publicId: artist.artistPublicId,
          displayName: artist.displayName,
          followedAt: artist.createdAt,
        })),
      ]);
      if (artists.length > MAX_FOLLOWED_ARTISTS) {
        warnSync('Reduce your follows to 250 before they can be merged.');
        return;
      }
      const merged = await mergeAccountFollowing(toAccountRequests(artists));
      if (merged.type === 'ok') {
        applyAccount(merged.data);
      } else if (merged.type === 'limit') {
        warnSync('Reduce your follows to 250 before they can be merged.');
      } else if (merged.type !== 'unauthenticated') {
        warnSync('Changes will be retried the next time you visit K-pop.');
      }
      return;
    }

    let latest = accountResult.data;
    const pending = current.pending;
    for (const publicId of pending.removals) {
      const result = await removeAccountFollowing(publicId);
      if (result.type !== 'ok') {
        if (result.type !== 'unauthenticated') {
          warnSync('Changes will be retried the next time you visit K-pop.');
        }
        return;
      }
      latest = result.data;
    }
    for (const publicId of pending.additions) {
      const artist = storeRef.current.artists.find(
        (followedArtist) => followedArtist.publicId === publicId
      );
      if (!artist) {
        continue;
      }
      const result = await addAccountFollowing({
        artistPublicId: artist.publicId,
        displayName: artist.displayName,
      });
      if (result.type !== 'ok') {
        if (result.type === 'limit') {
          warnSync('Reduce your follows to 250 before they can be merged.');
        } else if (result.type !== 'unauthenticated') {
          warnSync('Changes will be retried the next time you visit K-pop.');
        }
        return;
      }
      latest = result.data;
    }
    applyAccount(latest);
  }, [applyAccount, warnSync]);

  useEffect(() => {
    if (isLoaded) {
      void syncAccount();
    }
  }, [isLoaded, syncAccount]);

  const follow = useCallback(
    (artist: { publicId: string; displayName: string }): FollowResult => {
      const parsedArtist = FollowedArtistSchema.omit({
        followedAt: true,
      }).safeParse(artist);
      if (!parsedArtist.success) {
        return 'already-following';
      }
      const current = storeRef.current;
      if (
        current.artists.some(
          (followedArtist) =>
            followedArtist.publicId === artist.publicId ||
            artistIdentityKey(followedArtist.displayName) ===
              artistIdentityKey(artist.displayName)
        )
      ) {
        return 'already-following';
      }
      if (current.artists.length >= MAX_FOLLOWED_ARTISTS) {
        return 'limit-reached';
      }

      persistStore({
        ...current,
        artists: [
          ...current.artists,
          { ...parsedArtist.data, followedAt: new Date().toISOString() },
        ],
        pending: {
          additions: unique([...current.pending.additions, artist.publicId]),
          removals: current.pending.removals.filter(
            (id) => id !== artist.publicId
          ),
        },
      });
      void syncAccount();
      return 'added';
    },
    [persistStore, syncAccount]
  );

  const unfollow = useCallback(
    (publicId: string, displayName?: string) => {
      const current = storeRef.current;
      const matchingIds = new Set(
        current.artists
          .filter(
            (artist) =>
              artist.publicId === publicId ||
              (displayName !== undefined &&
                artistIdentityKey(artist.displayName) ===
                  artistIdentityKey(displayName))
          )
          .map((artist) => artist.publicId)
      );
      persistStore({
        ...current,
        artists: current.artists.filter(
          (artist) => !matchingIds.has(artist.publicId)
        ),
        pending: {
          additions: current.pending.additions.filter(
            (id) => !matchingIds.has(id)
          ),
          removals: unique([...current.pending.removals, ...matchingIds]),
        },
      });
      void syncAccount();
    },
    [persistStore, syncAccount]
  );

  const isFollowing = useCallback(
    (publicId: string, displayName?: string) =>
      store.artists.some(
        (artist) =>
          artist.publicId === publicId ||
          (displayName !== undefined &&
            artistIdentityKey(artist.displayName) ===
              artistIdentityKey(displayName))
      ),
    [store.artists]
  );

  const artists = useMemo(() => dedupeArtists(store.artists), [store.artists]);

  const value = useMemo(
    () => ({
      artists,
      isLoaded,
      isManagerOpen,
      follow,
      unfollow,
      isFollowing,
      openManager: () => setManagerOpen(true),
      setManagerOpen,
    }),
    [artists, follow, isFollowing, isLoaded, isManagerOpen, unfollow]
  );

  return (
    <FollowingContext.Provider value={value}>
      {children}
    </FollowingContext.Provider>
  );
}

export function useFollowing() {
  const context = useContext(FollowingContext);
  if (!context) {
    throw new Error('useFollowing must be used within a FollowingProvider.');
  }
  return context;
}

function toAccountRequests(artists: FollowedArtist[]) {
  return artists.map((artist) => ({
    artistPublicId: artist.publicId,
    displayName: artist.displayName,
  }));
}

function dedupeArtists(artists: FollowedArtist[]) {
  return Array.from(
    new Map(
      artists.map((artist) => [artistIdentityKey(artist.displayName), artist])
    ).values()
  );
}

function artistIdentityKey(displayName: string) {
  return displayName.trim().toLowerCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
