import { ShortenedUrl } from '@/lib/types/shorten';
import { ArrowRight, Link2, ListMusic, Smile } from 'lucide-react';
import AccountNavigationLink from './AccountNavigationLink';
import LogoutButton from './LogoutButton';

export interface UserHomeProps {
  username: string;
  isApproved: boolean;
  shortenedUrls?: ShortenedUrl[];
  followedArtistCount?: number;
}

export default function UserHome({
  username,
  isApproved,
  shortenedUrls,
  followedArtistCount,
}: UserHomeProps) {
  return (
    <div className='min-h-dvh w-full bg-background'>
      <header className='border-b border-border bg-background/95'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-6'>
          <div>
            <p className='text-sm text-muted-foreground'>Your account</p>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Welcome back, {username}
            </h1>
          </div>
          <LogoutButton
            className='text-muted-foreground hover:bg-muted hover:text-foreground'
            variant='ghost'
          />
        </div>
      </header>
      <main className='mx-auto w-full max-w-6xl px-4 py-6 md:px-6'>
        {isApproved ? (
          <ApprovedHome
            followedArtistCount={followedArtistCount}
            shortenedUrls={shortenedUrls}
          />
        ) : (
          <AwaitingApproval />
        )}
      </main>
    </div>
  );
}

function ApprovedHome({
  shortenedUrls,
  followedArtistCount,
}: Pick<UserHomeProps, 'shortenedUrls' | 'followedArtistCount'>) {
  const recentUrls = [...(shortenedUrls ?? [])]
    .sort((left, right) => right.created.getTime() - left.created.getTime())
    .slice(0, 3);

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 lg:grid-cols-2'>
        <section
          aria-labelledby='recent-links-heading'
          className='rounded-2xl border border-border bg-card p-5'
        >
          <div className='flex items-start justify-between gap-4'>
            <div>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Link2 className='size-4' />
                URL Shortener
              </div>
              <h3
                id='recent-links-heading'
                className='mt-2 text-xl font-semibold'
              >
                {shortenedUrls ? `${shortenedUrls.length} links` : 'Your links'}
              </h3>
            </div>
            <DashboardLink href='/shorten'>Manage links</DashboardLink>
          </div>

          <div className='mt-5 space-y-2'>
            {recentUrls.length ? (
              recentUrls.map((url) => (
                <AccountNavigationLink
                  key={url.short_id}
                  href={`/${url.short_id}`}
                  loadingLabel='Opening…'
                  className='flex w-full items-center gap-1 rounded-lg border border-border/70 px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-wait disabled:opacity-70'
                >
                  <span className='font-medium'>/{url.short_id}</span>
                  <span className='ml-2 text-muted-foreground'>
                    {url.number_of_uses} uses
                  </span>
                </AccountNavigationLink>
              ))
            ) : (
              <p className='rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground'>
                {shortenedUrls
                  ? 'You have not created any links yet.'
                  : 'Your links could not be loaded.'}
              </p>
            )}
          </div>
        </section>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-1'>
          <section className='rounded-2xl border border-primary-kp/30 bg-primary-kp/5 p-5'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <ListMusic className='size-4' />
              K-pop
            </div>
            <h3 className='mt-2 text-xl font-semibold'>
              {followedArtistCount === undefined
                ? 'Your following'
                : `${followedArtistCount} followed ${followedArtistCount === 1 ? 'artist' : 'artists'}`}
            </h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              Keep up with releases from the artists you follow.
            </p>
            <div className='mt-4'>
              <DashboardLink href='/kpop?view=following'>
                Open Following
              </DashboardLink>
            </div>
          </section>

          <section className='rounded-2xl border border-primary-em/30 bg-primary-em/5 p-5'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Smile className='size-4' />
              Emojifier
            </div>
            <h3 className='mt-2 text-xl font-semibold'>
              AI suggestions enabled
            </h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              Emoji suggestions are available.
            </p>
            <div className='mt-4'>
              <DashboardLink href='/emojify'>Open Emojifier</DashboardLink>
            </div>
          </section>
        </div>
      </div>

      <AccountNavigationLink
        href='/'
        loadingLabel='Opening…'
        className='inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:cursor-wait disabled:opacity-70'
      >
        Browse all apps <ArrowRight className='size-4' />
      </AccountNavigationLink>
    </div>
  );
}

function DashboardLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <AccountNavigationLink
      href={href}
      loadingLabel='Opening…'
      className='inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-70'
    >
      {children} <ArrowRight className='size-4' />
    </AccountNavigationLink>
  );
}

function AwaitingApproval() {
  return (
    <section className='max-w-xl rounded-2xl border border-amber-500/35 bg-amber-500/5 p-6'>
      <p className='text-sm font-medium text-amber-700 dark:text-amber-300'>
        Account pending approval
      </p>
      <h2 className='mt-2 text-xl font-semibold'>You are nearly there.</h2>
      <p className='mt-2 text-sm text-muted-foreground'>
        Your registration is waiting for approval. Once approved, reload this
        page to access your account tools.
      </p>
    </section>
  );
}
