import { z } from 'zod';

export const ComebackResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.string(),
  artist_public_id: z.string().uuid(),
  album: z.string(),
  date: z.string(),
  release_type: z.string(),
  urls: z.array(z.string()),
});

export const ComebacksResultSchema = z.object({
  count: z.number(),
  previous: z.string().nullable(),
  next: z.string().nullable(),
  total_pages: z.number(),
  results: z.array(ComebackResponseSchema),
});

export type ComebacksResult = z.infer<typeof ComebacksResultSchema>;
export type ComebackResponse = z.infer<typeof ComebackResponseSchema>;

export const WatchlistComebacksQuerySchema = z.object({
  artist_public_ids: z.array(z.string().uuid()).max(250),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.number().int().positive().optional(),
  page_size: z.number().int().positive().max(100).optional(),
  ordering: z.enum(['release_date_asc', 'upcoming_first']).optional(),
});

export type WatchlistComebacksQuery = z.infer<
  typeof WatchlistComebacksQuerySchema
>;

export const KpopArtistSchema = z.object({
  public_id: z.string().uuid(),
  name: z.string(),
});

export const KpopArtistsResultSchema = z.array(KpopArtistSchema);

export type KpopArtist = z.infer<typeof KpopArtistSchema>;
