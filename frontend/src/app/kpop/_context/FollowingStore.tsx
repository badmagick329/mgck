'use client';

import { z } from 'zod';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'mgck:kpop-following:v1';
export const MAX_FOLLOWED_ARTISTS = 250;

const FollowedArtistSchema = z.object({
  publicId: z.string().uuid(),
  displayName: z.string().min(1),
  followedAt: z.string().datetime(),
});

const FollowingStoreSchema = z.object({
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
  unfollow: (publicId: string) => void;
  isFollowing: (publicId: string) => boolean;
  openManager: () => void;
  setManagerOpen: (open: boolean) => void;
};

const FollowingContext = createContext<FollowingContextValue | undefined>(
  undefined
);

const initialStore: FollowingStore = { version: 1, artists: [] };

export function FollowingProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<FollowingStore>(initialStore);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isManagerOpen, setManagerOpen] = useState(false);

  useEffect(() => {
    try {
      const savedStore = localStorage.getItem(STORAGE_KEY);
      if (savedStore) {
        const parsedStore = FollowingStoreSchema.safeParse(JSON.parse(savedStore));
        if (parsedStore.success) {
          setStore(parsedStore.data);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const persistStore = useCallback((nextStore: FollowingStore) => {
    setStore(nextStore);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
    } catch (error) {
      console.error('Could not save followed K-pop artists.', error);
    }
  }, []);

  const follow = useCallback(
    (artist: { publicId: string; displayName: string }): FollowResult => {
      const parsedArtist = FollowedArtistSchema.omit({ followedAt: true }).safeParse(
        artist
      );
      if (!parsedArtist.success) {
        return 'already-following';
      }
      if (store.artists.some(({ publicId }) => publicId === artist.publicId)) {
        return 'already-following';
      }
      if (store.artists.length >= MAX_FOLLOWED_ARTISTS) {
        return 'limit-reached';
      }

      persistStore({
        version: 1,
        artists: [
          ...store.artists,
          {
            ...parsedArtist.data,
            followedAt: new Date().toISOString(),
          },
        ],
      });
      return 'added';
    },
    [persistStore, store.artists]
  );

  const unfollow = useCallback(
    (publicId: string) => {
      persistStore({
        version: 1,
        artists: store.artists.filter((artist) => artist.publicId !== publicId),
      });
    },
    [persistStore, store.artists]
  );

  const isFollowing = useCallback(
    (publicId: string) => store.artists.some((artist) => artist.publicId === publicId),
    [store.artists]
  );

  const value = useMemo(
    () => ({
      artists: store.artists,
      isLoaded,
      isManagerOpen,
      follow,
      unfollow,
      isFollowing,
      openManager: () => setManagerOpen(true),
      setManagerOpen,
    }),
    [follow, isFollowing, isLoaded, isManagerOpen, store.artists, unfollow]
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
