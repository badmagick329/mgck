'use client';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { fetchKpopArtists, partitionKpopArtistResults } from '@/lib/kpop';
import { KpopArtist } from '@/lib/types/kpop';
import { Check, Loader2, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { MAX_FOLLOWED_ARTISTS, useFollowing } from '../_context/FollowingStore';

export default function FollowedArtistsDialog() {
  const {
    artists: followedArtists,
    follow,
    unfollow,
    isFollowing,
    isManagerOpen,
    setManagerOpen,
  } = useFollowing();
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<KpopArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [followedSort, setFollowedSort] = useState<'alphabetical' | 'recent'>(
    'alphabetical'
  );
  const searchRequestId = useRef(0);
  const followLimitReached = followedArtists.length >= MAX_FOLLOWED_ARTISTS;
  const visibleFollowedArtists = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return followedArtists
      .filter((artist) => artist.displayName.toLowerCase().includes(query))
      .sort((first, second) => {
        if (followedSort === 'recent') {
          return second.followedAt.localeCompare(first.followedAt);
        }
        return first.displayName.localeCompare(second.displayName);
      });
  }, [followedArtists, followedSort, searchText]);
  const partitionedResults = useMemo(
    () => partitionKpopArtistResults(results, searchText),
    [results, searchText]
  );

  useEffect(() => {
    const query = searchText.trim();
    if (!query) {
      setResults([]);
      setSearchError('');
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const requestId = ++searchRequestId.current;
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      setSearchError('');
      void fetchKpopArtists(query, controller.signal)
        .then((artists) => {
          if (
            !controller.signal.aborted &&
            requestId === searchRequestId.current
          ) {
            setResults(artists);
          }
        })
        .catch((error) => {
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          if (
            !controller.signal.aborted &&
            requestId === searchRequestId.current
          ) {
            setSearchError('Could not search artists.');
          }
        })
        .finally(() => {
          if (
            !controller.signal.aborted &&
            requestId === searchRequestId.current
          ) {
            setIsSearching(false);
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchText]);

  function artistResultItem(artist: KpopArtist, description?: string) {
    const following = isFollowing(artist.public_id, artist.name);
    return (
      <CommandItem
        key={artist.public_id}
        value={`${artist.name} ${artist.public_id}`}
        disabled={!following && followLimitReached}
        onSelect={() => {
          if (following) {
            unfollow(artist.public_id, artist.name);
          } else {
            follow({
              publicId: artist.public_id,
              displayName: artist.name,
            });
          }
        }}
      >
        <span className='min-w-0'>
          <span className='block'>{artist.name}</span>
          {description && (
            <span className='block text-xs text-muted-foreground'>
              {description}
            </span>
          )}
        </span>
        {following ? (
          <Minus className='ml-auto h-4 w-4 shrink-0' />
        ) : (
          <Plus className='ml-auto h-4 w-4 shrink-0' />
        )}
      </CommandItem>
    );
  }

  return (
    <CommandDialog
      open={isManagerOpen}
      onOpenChange={setManagerOpen}
      title='Manage followed artists'
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder='Search artists to follow...'
          value={searchText}
          onValueChange={setSearchText}
        />
        <CommandList>
          <div className='flex items-center justify-between gap-2 px-3 pt-3'>
            <span className='text-xs font-medium text-muted-foreground'>
              Following ({followedArtists.length})
            </span>
            <div className='flex gap-1'>
              <Button
                type='button'
                size='sm'
                variant={
                  followedSort === 'alphabetical' ? 'secondary' : 'ghost'
                }
                onClick={() => setFollowedSort('alphabetical')}
              >
                A–Z
              </Button>
              <Button
                type='button'
                size='sm'
                variant={followedSort === 'recent' ? 'secondary' : 'ghost'}
                onClick={() => setFollowedSort('recent')}
              >
                Recent
              </Button>
            </div>
          </div>
          <CommandGroup>
            {visibleFollowedArtists.map((artist) => (
              <CommandItem
                key={artist.publicId}
                value={`${artist.displayName} ${artist.publicId}`}
                onSelect={() => unfollow(artist.publicId)}
              >
                <span>{artist.displayName}</span>
                <Minus className='ml-auto h-4 w-4' />
              </CommandItem>
            ))}
          </CommandGroup>
          {isSearching && (
            <div className='flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Searching artists...
            </div>
          )}
          {!isSearching && searchError && (
            <div className='px-3 py-4 text-sm text-destructive'>
              {searchError}
            </div>
          )}
          {!isSearching && !searchError && searchText.trim() && (
            <>
              {partitionedResults.exact && (
                <CommandGroup heading='Artist to follow'>
                  {artistResultItem(
                    partitionedResults.exact,
                    `Includes current and future credits containing “${partitionedResults.exact.name}”.`
                  )}
                </CommandGroup>
              )}
              {partitionedResults.exact &&
                partitionedResults.covered.length > 0 && (
                  <CommandGroup
                    heading={
                      isFollowing(
                        partitionedResults.exact.public_id,
                        partitionedResults.exact.name
                      )
                        ? `Covered by following ${partitionedResults.exact.name}`
                        : `Included when you follow ${partitionedResults.exact.name}`
                    }
                  >
                    {partitionedResults.covered.map((artist) => (
                      <div
                        key={artist.public_id}
                        className='flex items-center gap-2 px-2 py-3 text-sm'
                      >
                        <span>{artist.name}</span>
                        <span className='ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground'>
                          <Check className='h-4 w-4' />
                          Included
                        </span>
                      </div>
                    ))}
                  </CommandGroup>
                )}
              {partitionedResults.fallback.length > 0 && (
                <>
                  <p className='px-3 pt-3 text-xs text-muted-foreground'>
                    Following a name includes future credits containing that
                    complete name.
                  </p>
                  <CommandGroup heading='Search results'>
                    {partitionedResults.fallback.map((artist) =>
                      artistResultItem(artist)
                    )}
                  </CommandGroup>
                </>
              )}
            </>
          )}
          {!isSearching &&
            !searchError &&
            searchText.trim() &&
            results.length === 0 && (
              <CommandEmpty>No artists found.</CommandEmpty>
            )}
          {followLimitReached && (
            <p className='px-3 py-2 text-xs text-muted-foreground'>
              You can follow up to {MAX_FOLLOWED_ARTISTS} artists.
            </p>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
