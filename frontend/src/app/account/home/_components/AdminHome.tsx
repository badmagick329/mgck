import { fetchWithAuthHeader } from '@/lib/account/requests';
import { UsersResponseData, usersResponseSchema } from '@/lib/types/account';
import UserManager from '@/app/account/home/_components/UserManager';
import { API_USERS_BASE } from '@/lib/consts/urls';
import LogoutButton from './LogoutButton';
import FeedbackList from './FeedbackList';
import AppLauncher from '@/app/_components/AppLauncher';
import { FileImage, ListMusic, Link2, Milestone } from 'lucide-react';

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
    <div className='w-full grow bg-background-kp'>
      <UserWelcomeHeader username={username} />
      <main className='mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6'>
        <section>
          <h2 className='text-xl font-bold'>Quick access</h2>
          <p className='mb-3 text-sm text-muted-foreground'>Jump back into the apps you maintain.</p>
          <AppLauncher apps={[
            { href: '/kpop', name: 'K-pop', description: 'Release timeline and artist following.', icon: <ListMusic />, className: 'bg-background-kp' },
            { href: '/shorten', name: 'Shortener', description: 'Manage your links.', icon: <Link2 />, className: 'bg-secondary' },
            { href: '/milestones', name: 'Milestones', description: 'Open the local-first tracker.', icon: <Milestone />, className: 'bg-background-ml' },
            { href: '/image-edit', name: 'AutoCropper', description: 'Open the local image utility.', icon: <FileImage />, className: 'bg-background-dg' },
          ]} />
        </section>
      </main>
      <UserManager users={usersAndRoles} />
      <section className='px-4 pb-8'><h2 className='mb-2 text-center text-xl font-bold'>Feedback queue</h2><FeedbackList /></section>
    </div>
  );
}

function UserWelcomeHeader({ username }: { username: string }) {
  return (
    <header className='bg-gradient-to-r from-purple-600 to-purple-900 py-8'>
      <div className='container mx-auto flex items-center justify-between px-4 text-gray-50'>
        <h1 className='text-3xl font-bold'>Welcome, {username}</h1>
        <LogoutButton />
      </div>
    </header>
  );
}
