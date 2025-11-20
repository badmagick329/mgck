import { z } from 'zod';

export const ComebackResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  artist: z.string(),
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
