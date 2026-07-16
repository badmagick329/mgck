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
import { fetchKpopArtists } from '@/lib/kpop';
import { KpopArtist } from '@/lib/types/kpop';
import { Loader2, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  const searchRequestId = useRef(0);
  const followLimitReached = followedArtists.length >= MAX_FOLLOWED_ARTISTS;

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

  return (
    <CommandDialog
      open={isManagerOpen}
      onOpenChange={setManagerOpen}
      title='Manage followed artists'
    >
      <Command>
        <CommandInput
          placeholder='Search artists to follow...'
          value={searchText}
          onValueChange={setSearchText}
        />
        <CommandList>
          <CommandGroup heading={`Following (${followedArtists.length})`}>
            {followedArtists.map((artist) => (
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
            <CommandGroup heading='Search results'>
              {results.map((artist) => {
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
                    <span>{artist.name}</span>
                    {following ? (
                      <Minus className='ml-auto h-4 w-4' />
                    ) : (
                      <Plus className='ml-auto h-4 w-4' />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
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
