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

const STORAGE_KEY = 'mgck:kpop-following:v3';
const anonymousStorageKey = 'mgck:kpop-following:anonymous:v4';
export const followingAccountStorageKey = (userId: string) =>
  `mgck:kpop-following:account:${encodeURIComponent(userId)}:v4`;
const V2_STORAGE_KEY = 'mgck:kpop-following:v2';
const LEGACY_STORAGE_KEY = 'mgck:kpop-following:v1';
export const MAX_FOLLOWED_ARTISTS = 250;
export const FOLLOWING_LOOKBACK_OPTIONS = [30, 90, 180] as const;

export type FollowingLookbackDays = (typeof FOLLOWING_LOOKBACK_OPTIONS)[number];
export type FollowingOrdering = 'upcoming_first' | 'recent_first';

const FollowedArtistSchema = z.object({
  publicId: z.string().uuid(),
  displayName: z.string().min(1),
  followedAt: z.string().datetime(),
});
const PendingChangesSchema = z.object({
  additions: z.array(z.string().uuid()).max(MAX_FOLLOWED_ARTISTS),
  removals: z.array(z.string().uuid()).max(MAX_FOLLOWED_ARTISTS),
});
const FollowingPreferencesSchema = z.object({
  lookbackDays: z.union([z.literal(30), z.literal(90), z.literal(180)]),
  ordering: z.enum(['upcoming_first', 'recent_first']),
});
const FollowingStoreSchema = z.object({
  version: z.literal(3),
  artists: z.array(FollowedArtistSchema).max(MAX_FOLLOWED_ARTISTS),
  accountUserId: z.string().min(1).nullable(),
  pending: PendingChangesSchema,
  preferences: FollowingPreferencesSchema,
});
const V2FollowingStoreSchema = z.object({
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
const defaultPreferences: z.infer<typeof FollowingPreferencesSchema> = {
  lookbackDays: 30,
  ordering: 'upcoming_first',
};

type FollowingContextValue = {
  artists: FollowedArtist[];
  isLoaded: boolean;
  isManagerOpen: boolean;
  preferences: z.infer<typeof FollowingPreferencesSchema>;
  follow: (artist: { publicId: string; displayName: string }) => FollowResult;
  unfollow: (publicId: string, displayName?: string) => void;
  isFollowing: (publicId: string, displayName?: string) => boolean;
  setLookbackDays: (lookbackDays: FollowingLookbackDays) => void;
  setOrdering: (ordering: FollowingOrdering) => void;
  openManager: () => void;
  setManagerOpen: (open: boolean) => void;
};

const FollowingContext = createContext<FollowingContextValue | undefined>(
  undefined
);
const initialStore: FollowingStore = {
  version: 3,
  artists: [],
  accountUserId: null,
  pending: { additions: [], removals: [] },
  preferences: defaultPreferences,
};

export function FollowingProvider({
  children,
  accountUserId,
}: {
  children: ReactNode;
  accountUserId: string | null;
}) {
  const [store, setStore] = useState<FollowingStore>({
    ...initialStore,
    accountUserId,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isManagerOpen, setManagerOpen] = useState(false);
  const storeRef = useRef(store);
  const sessionRef = useRef(accountUserId);
  sessionRef.current = accountUserId;
  const syncing = useRef(false);
  const syncRequested = useRef(false);
  const showedSyncWarning = useRef(false);

  const persistStore = useCallback((nextStore: FollowingStore) => {
    storeRef.current = nextStore;
    setStore(nextStore);
    try {
      localStorage.setItem(
        nextStore.accountUserId
          ? followingAccountStorageKey(nextStore.accountUserId)
          : anonymousStorageKey,
        JSON.stringify(nextStore)
      );
      return true;
    } catch {
      toast({
        title: 'Could not save followed artists',
        description: 'Your latest changes may not survive a refresh.',
        variant: 'destructive',
      });
      return false;
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
    sessionRef.current = accountUserId;
    // Preserve an old cache under its recorded owner before selecting the verified session.
    const migrate = (
      oldKey: string,
      schema:
        | typeof FollowingStoreSchema
        | typeof V2FollowingStoreSchema
        | typeof LegacyFollowingStoreSchema
    ) => {
      const raw = localStorage.getItem(oldKey);
      if (!raw) return;
      try {
        const parsed = schema.safeParse(JSON.parse(raw));
        if (parsed.success) {
          const migrated: FollowingStore = {
            ...initialStore,
            ...parsed.data,
            version: 3,
          };
          const target = migrated.accountUserId
            ? followingAccountStorageKey(migrated.accountUserId)
            : anonymousStorageKey;
          if (!localStorage.getItem(target))
            localStorage.setItem(target, JSON.stringify(migrated));
        }
        localStorage.removeItem(oldKey);
      } catch {
        /* Keep unreadable or unsaved data for recovery; never display it. */
      }
    };
    try {
      migrate(STORAGE_KEY, FollowingStoreSchema);
      migrate(V2_STORAGE_KEY, V2FollowingStoreSchema);
      migrate(LEGACY_STORAGE_KEY, LegacyFollowingStoreSchema);
      const selectedKey = accountUserId
        ? followingAccountStorageKey(accountUserId)
        : anonymousStorageKey;
      const savedStore = localStorage.getItem(selectedKey);
      const parsedStore = savedStore
        ? FollowingStoreSchema.safeParse(JSON.parse(savedStore))
        : null;
      if (
        parsedStore?.success &&
        parsedStore.data.accountUserId === accountUserId
      ) {
        persistStore(parsedStore.data);
      } else {
        persistStore({ ...initialStore, accountUserId });
      }
    } catch {
      persistStore({ ...initialStore, accountUserId });
    } finally {
      setIsLoaded(true);
    }
    return () => {
      sessionRef.current = null;
    };
  }, [accountUserId, persistStore]);

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
      return persistStore({
        version: 3,
        artists,
        accountUserId: account.userId,
        pending,
        preferences: storeRef.current.preferences,
      });
    },
    [persistStore]
  );

  const syncAccountOnce = useCallback(async () => {
    if (!accountUserId) return;
    const snapshot = storeRef.current;
    const accountResult = await getAccountFollowing();
    if (sessionRef.current !== accountUserId) return;
    if (accountResult.type === 'unauthenticated') {
      return;
    }
    if (accountResult.type !== 'ok') {
      warnSync('Changes will be retried the next time you visit K-pop.');
      return;
    }
    if (accountResult.data.userId !== accountUserId) return;

    const current = storeRef.current;
    let anonymous: FollowingStore | null = null;
    try {
      const anonymousRaw = localStorage.getItem(anonymousStorageKey);
      const parsed = anonymousRaw
        ? FollowingStoreSchema.safeParse(JSON.parse(anonymousRaw))
        : null;
      if (parsed?.success && parsed.data.accountUserId === null)
        anonymous = parsed.data;
    } catch {
      /* Corrupt guest data cannot be imported into an account. */
    }
    if (anonymous && anonymous.artists.length) {
      const artists = dedupeArtists([
        ...anonymous.artists,
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
      const merged = await mergeAccountFollowing(
        toAccountRequests(artists),
        accountUserId
      );
      if (sessionRef.current !== accountUserId) return;
      if (merged.type === 'ok') {
        if (merged.data.userId !== accountUserId) return;
        if (applyAccount(merged.data, storeRef.current.pending)) {
          localStorage.removeItem(anonymousStorageKey);
        }
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
      const result = await removeAccountFollowing(publicId, accountUserId);
      if (sessionRef.current !== accountUserId) return;
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
      const result = await addAccountFollowing(
        {
          artistPublicId: artist.publicId,
          displayName: artist.displayName,
        },
        accountUserId
      );
      if (sessionRef.current !== accountUserId) return;
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
    // A response cannot acknowledge edits made after its request snapshot.
    applyAccount(
      latest,
      storeRef.current === snapshot ? undefined : storeRef.current.pending
    );
  }, [accountUserId, applyAccount, warnSync]);

  const syncAccount = useCallback(async () => {
    syncRequested.current = true;
    if (syncing.current) return;
    syncing.current = true;
    try {
      while (syncRequested.current) {
        syncRequested.current = false;
        await syncAccountOnce();
      }
    } catch {
      warnSync('Changes will be retried the next time you visit K-pop.');
    } finally {
      syncing.current = false;
    }
  }, [syncAccountOnce, warnSync]);

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
        accountUserId !== sessionRef.current ||
        current.accountUserId !== accountUserId
      )
        return 'already-following';
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
    [accountUserId, persistStore, syncAccount]
  );

  const unfollow = useCallback(
    (publicId: string, displayName?: string) => {
      const current = storeRef.current;
      if (
        accountUserId !== sessionRef.current ||
        current.accountUserId !== accountUserId
      )
        return;
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
    [accountUserId, persistStore, syncAccount]
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

  const setLookbackDays = useCallback(
    (lookbackDays: FollowingLookbackDays) => {
      if (!FOLLOWING_LOOKBACK_OPTIONS.includes(lookbackDays)) {
        return;
      }
      const current = storeRef.current;
      if (
        accountUserId !== sessionRef.current ||
        current.accountUserId !== accountUserId
      )
        return;
      persistStore({
        ...current,
        preferences: { ...current.preferences, lookbackDays },
      });
    },
    [accountUserId, persistStore]
  );

  const setOrdering = useCallback(
    (ordering: FollowingOrdering) => {
      const current = storeRef.current;
      if (
        accountUserId !== sessionRef.current ||
        current.accountUserId !== accountUserId
      )
        return;
      persistStore({
        ...current,
        preferences: { ...current.preferences, ordering },
      });
    },
    [accountUserId, persistStore]
  );

  const ownerMatches = store.accountUserId === accountUserId;
  const artists = useMemo(
    () => (ownerMatches ? dedupeArtists(store.artists) : []),
    [store.artists, ownerMatches]
  );

  const value = useMemo(
    () => ({
      artists,
      isLoaded: isLoaded && ownerMatches,
      isManagerOpen,
      preferences: ownerMatches ? store.preferences : defaultPreferences,
      follow,
      unfollow,
      isFollowing,
      setLookbackDays,
      setOrdering,
      openManager: () => setManagerOpen(true),
      setManagerOpen,
    }),
    [
      artists,
      follow,
      isFollowing,
      isLoaded,
      ownerMatches,
      isManagerOpen,
      setLookbackDays,
      setOrdering,
      store.preferences,
      unfollow,
    ]
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
