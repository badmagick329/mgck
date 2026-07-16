'use client';

import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';

import {
  MAX_FOLLOWED_ARTISTS,
  useFollowing,
} from '../_context/FollowingStore';

export default function FollowArtistButton({
  publicId,
  displayName,
}: {
  publicId: string;
  displayName: string;
}) {
  const { artists, follow, unfollow, isFollowing, isLoaded } = useFollowing();
  const following = isFollowing(publicId);
  const followLimitReached = artists.length >= MAX_FOLLOWED_ARTISTS;
  const label = following
    ? `Unfollow ${displayName}`
    : followLimitReached
      ? `Following limit reached (${MAX_FOLLOWED_ARTISTS})`
      : `Follow ${displayName}`;

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      aria-label={label}
      aria-pressed={following}
      title={label}
      disabled={!isLoaded || (!following && followLimitReached)}
      className={following ? 'text-yellow-400 hover:text-yellow-300' : ''}
      onClick={() => {
        if (following) {
          unfollow(publicId);
          return;
        }
        follow({ publicId, displayName });
      }}
    >
      <Star className={following ? 'fill-current' : ''} />
    </Button>
  );
}
