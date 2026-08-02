import AppLauncher from '@/app/_components/AppLauncher';
import UserManager from '@/app/account/home/_components/UserManager';
import { fetchWithAuthHeader } from '@/lib/account/requests';
import { API_USERS_BASE } from '@/lib/consts/urls';
import { UsersResponseData, usersResponseSchema } from '@/lib/types/account';
import { Link2, ListMusic, Milestone, Smile } from 'lucide-react';

import FeedbackList from './FeedbackList';
import LogoutButton from './LogoutButton';

const BASE_URL = process.env.CORE_API_BASE_URL;

export default async function AdminHome({ username }: { username: string }) {
  const response = await fetchWithAuthHeader({
    url: `${BASE_URL}${API_USERS_BASE}`,
    method: 'GET',
  });
  let usersAndRoles = [] as UsersResponseData;
  const parsed = usersResponseSchema.safeParse(response);
  if (parsed.success) {
    usersAndRoles = parsed.data.data;
  }

  return (
    <div className='min-h-dvh w-full bg-background'>
      <header className='border-b border-border bg-background/95'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 md:px-6'>
          <div>
            <p className='text-sm text-muted-foreground'>Admin workspace</p>
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
      <main className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6'>
        <section aria-labelledby='continue-heading'>
          <div className='mb-3'>
            <h2 id='continue-heading' className='text-lg font-semibold'>
              Continue to an app
            </h2>
          </div>
          <AppLauncher
            apps={[
              {
                href: '/kpop',
                name: 'K-pop',
                description: 'Release timeline and artist following.',
                icon: <ListMusic />,
                className:
                  'border-primary-kp/30 bg-primary-kp/5 hover:border-primary-kp/60 hover:bg-primary-kp/10',
              },
              {
                href: '/shorten',
                name: 'Shortener',
                description: 'Manage your links.',
                icon: <Link2 />,
                className:
                  'border-primary-kp/30 bg-primary-kp/5 hover:border-primary-kp/60 hover:bg-primary-kp/10',
              },
              {
                href: '/emojify',
                name: 'Emojifier',
                description: 'Use your AI emoji suggestions.',
                icon: <Smile />,
                className:
                  'border-primary-em/30 bg-primary-em/5 hover:border-primary-em/60 hover:bg-primary-em/10',
              },
              {
                href: '/milestones',
                name: 'Milestones',
                description: 'Open the local-first tracker.',
                icon: <Milestone />,
                className:
                  'border-primary-ml/30 bg-primary-ml/5 hover:border-primary-ml/60 hover:bg-primary-ml/10',
              },
            ]}
          />
        </section>
        <div className='grid gap-6 lg:grid-cols-2'>
          <UserManager users={usersAndRoles} />
          <FeedbackList />
        </div>
      </main>
    </div>
  );
}
