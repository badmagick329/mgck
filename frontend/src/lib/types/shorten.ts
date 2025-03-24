import { z } from 'zod';
const shortenedUrlSchema = z.object({
  url: z.string(),
  short_id: z.string(),
  created: z
    .string()
    .datetime()
    .transform((str) => new Date(str)),
  accessed: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .nullable(),
  number_of_uses: z.number(),
});

export const shortenedUrlsByUsernameSchema = z.array(shortenedUrlSchema);

export type ShortenedUrl = z.infer<typeof shortenedUrlSchema>;
