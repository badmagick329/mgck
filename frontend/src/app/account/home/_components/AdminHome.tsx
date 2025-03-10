import { UserHomeProps } from '@/app/account/home/page';
import { fetchWithAuthHeader } from '@/lib/account/requests';
import { UsersResponseData, usersResponseSchema } from '@/lib/types/auth';
import UserManager from '@/app/account/home/_components/UserManager';
import { API_USERS_BASE } from '@/lib/consts/urls';
import LogoutButton from './LogoutButton';

const BASE_URL = process.env.USER_AUTH_BASE_URL;

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
      <UserManager users={usersAndRoles} />
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
