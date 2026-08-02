import Footer from '@/app/_components/Footer';
import HomeFeatureGrid, {
  HomeFeature,
} from '@/app/_components/HomeFeatureGrid';
import Navbar from '@/app/_components/Navbar';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { shortenerLauncherAccess } from '@/lib/account/launcher-access';
import { hasFilesAccess } from '@/lib/files/session';
import { getFilesUrl } from '@/lib/files/url';
import {
  FileUp,
  Film,
  Link2,
  ListMusic,
  Milestone,
  Smile,
  Sticker,
} from 'lucide-react';
import type { Metadata } from 'next';

const homeTitle = 'mgck — Red Velvet, K-pop comebacks, and side quests';
const homeDescription =
  'A Red Velvet GIF archive, K-pop comeback tracker, and a few small web tools.';

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: '/' },
  openGraph: {
    url: '/',
    title: homeTitle,
    description: homeDescription,
  },
  twitter: {
    title: homeTitle,
    description: homeDescription,
  },
};

export default async function Index() {
  const session = await getVerifiedCoreSession();
  const shortener = shortenerLauncherAccess(session);
  const filesAccess = await hasFilesAccess();
  const features: HomeFeature[] = [
    {
      title: 'Milestones',
      description: 'Milestone in minutes, days, seconds.',
      icon: <Milestone />,
      className:
        'border-primary-ml bg-background-ml text-foreground-ml shadow-glow-primary-ml',
      buttonClassName:
        'bg-primary-ml text-white shadow-glow-primary-ml hover:bg-primary-ml/90',
      primary: { href: '/milestones', label: 'Open Milestones' },
    },
    {
      title: 'URL Shortener',
      description: 'Shorten URLs and get usage data.',
      icon: <Link2 />,
      className:
        'border-primary-kp bg-background-kp text-foreground shadow-glow-primary-kp dark:text-primary-foreground',
      buttonClassName:
        'bg-primary-kp/80 text-white shadow-glow-primary-kp hover:bg-primary-kp',
      primary: shortener.action,
    },
    {
      title: 'Red Velvet Gfys',
      description: 'Browse through an archive of high quality Red Velvet Gfys.',
      icon: <Film />,
      className:
        'border-primary-gf bg-background-gf text-foreground shadow-glow-primary-gf dark:bg-background-gf-dark',
      buttonClassName:
        'bg-[hsl(10_42%_62%)] text-white shadow-[0_0_12px_hsla(10,42%,62%,0.8),0_0_2px_hsla(10,42%,62%,0.9)_inset] hover:bg-[hsl(10_42%_56%)]',
      primary: { href: '/gfys', label: 'Open Gfys' },
    },
    {
      title: 'K-pop Comebacks',
      description:
        'Check out the latest K-pop comebacks or search for releases you may have missed.',
      icon: <ListMusic />,
      className:
        'border-primary-kp bg-background-kp text-foreground shadow-glow-primary-kp dark:text-primary-foreground',
      buttonClassName:
        'bg-primary-kp/80 text-white shadow-glow-primary-kp hover:bg-primary-kp',
      primary: { href: '/kpop', label: 'Open K-pop Comebacks' },
    },
    {
      title: 'Emojifier',
      description: 'Improve your messages by adding emojis between each word.',
      icon: <Smile />,
      className:
        'border-primary-em bg-background-em text-foreground shadow-glow-primary-em dark:bg-background-em-dark dark:text-primary-foreground',
      buttonClassName:
        'bg-primary-em/80 text-white shadow-glow-primary-em hover:bg-primary-em',
      primary: { href: '/emojify', label: 'Open Emojifier' },
    },
    {
      title: 'Discord Emotes & Stickers',
      description: 'Turn video clips into Discord-ready emotes and stickers.',
      icon: <Sticker />,
      className:
        'border-primary-dg bg-background-dg text-foreground-dg shadow-glow-primary-dg dark:text-primary-foreground',
      buttonClassName:
        'bg-primary-dg/80 text-white shadow-glow-primary-dg hover:bg-primary-dg',
      primary: { href: '/discordgifs', label: 'Open Emotes & Stickers' },
    },
    {
      title: 'Files',
      description:
        'Private file sharing for people with a separately provided Files account.',
      icon: <FileUp />,
      className:
        'border-slate-400 bg-slate-200 text-slate-950 shadow-[0_0_28px_rgba(148,163,184,0.25)] dark:border-slate-300 dark:bg-slate-700 dark:text-slate-50',
      buttonClassName:
        'bg-slate-500 text-white shadow-[0_0_12px_rgba(148,163,184,0.65),0_0_2px_rgba(226,232,240,0.85)_inset] hover:bg-slate-400',
      primary: {
        href: getFilesUrl(),
        label: filesAccess ? 'Open Files' : 'Sign in to Files',
        external: true,
      },
      secondary: filesAccess
        ? undefined
        : {
            href: '/files/request-access',
            label: 'Request Files access',
          },
    },
  ];

  return (
    <main className='flex min-h-dvh flex-col'>
      <Navbar className='absolute z-10' />
      <header className='border-b border-primary/30 bg-gradient-to-b from-background via-background to-primary/10 px-6 py-20 text-center sm:py-24'>
        <h1 className='text-4xl font-bold tracking-tight md:text-5xl'>mgck</h1>
        <p className='mt-3 text-lg text-muted-foreground'>
          Red Velvet, K-pop comebacks, and side quests.
        </p>
      </header>
      <div className='bg-gradient-to-b from-primary/10 via-background to-background pt-10'>
        <HomeFeatureGrid features={features} />
      </div>
      <Footer />
    </main>
  );
}
