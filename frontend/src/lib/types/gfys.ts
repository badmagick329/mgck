import { useSearchParams } from 'next/navigation';
import { z } from 'zod';

export const GfyDataSchema = z.object({
  imgurId: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  date: z.string(),
  account: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});
export type GfyData = z.infer<typeof GfyDataSchema>;

export const GfyParsedResponseSchema = z.object({
  count: z.number(),
  previous: z.string().nullable(),
  next: z.string().nullable(),
  totalPages: z.number(),
  gfys: z.array(GfyDataSchema),
});
export type GfyParsedResponse = z.infer<typeof GfyParsedResponseSchema>;

export const GfyResultSchema = z.object({
  imgur_id: z.string(),
  imgur_title: z.string(),
  gfy_id: z.string(),
  gfy_title: z.string(),
  date: z.string(),
  account: z.string(),
  tags: z.array(z.string()),
  width: z.number().nullable(),
  height: z.number().nullable(),
});
export type GfyResult = z.infer<typeof GfyResultSchema>;

export const GfyResponseSchema = z.object({
  count: z.number(),
  previous: z.string().nullable(),
  next: z.string().nullable(),
  total_pages: z.number(),
  results: z.array(GfyResultSchema),
});
export type GfyResponse = z.infer<typeof GfyResponseSchema>;

export const GfyDetailResponseSchema = z.object({
  title: z.string(),
  tags: z.array(z.string()),
  date: z.string().nullable(),
  account: z.string(),
  imgur_id: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  video_url: z.string(),
});
export type GfyDetailResponse = z.infer<typeof GfyDetailResponseSchema>;

export const GfyViewDataSchema = z.object({
  index: z.number(),
  videoIds: z.array(z.string()),
  listUrl: z.string(),
});
export type GfyViewData = z.infer<typeof GfyViewDataSchema>;

export const AccountsResponseSchema = z.object({
  accounts: z.array(z.string()),
});
export type AccountsResponse = z.infer<typeof AccountsResponseSchema>;

export const SearchFormParamsSchema = z.object({
  title: z.string(),
  tags: z.string(),
  start_date: z.string(),
  end_date: z.string(),
});
export type SearchFormParams = z.infer<typeof SearchFormParamsSchema>;

export type SearchParams = ReturnType<typeof useSearchParams>;
