import { z } from 'zod';

export const AccountFollowedArtistSchema = z.object({
  artistPublicId: z.string().uuid(),
  displayName: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const AccountFollowingSchema = z.object({
  userId: z.string().min(1),
  artists: z.array(AccountFollowedArtistSchema).max(250),
});

export const AccountFollowingRequestSchema = z.object({
  artistPublicId: z.string().uuid(),
  displayName: z.string().min(1).max(255),
});

export type AccountFollowing = z.infer<typeof AccountFollowingSchema>;
export type AccountFollowingRequest = z.infer<
  typeof AccountFollowingRequestSchema
>;
