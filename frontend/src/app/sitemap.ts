import type { MetadataRoute } from 'next';

const publicPaths = [
  '/',
  '/discordgifs',
  '/emojify',
  '/gfys',
  '/image-edit',
  '/kpop',
  '/milestones',
  '/shorten',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({ url: `https://mgck.ink${path}` }));
}
