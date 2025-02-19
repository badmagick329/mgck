import { UserHomeProps } from '@/app/account/home/page';
import { fetchWithAuthHeader } from '@/lib/account/requests';
import { UsersResponseData, usersResponseSchema } from '@/lib/types/auth';
import UserManager from '@/app/account/home/_components/UserManager';
import { API_USERS_BASE } from '@/lib/consts/urls';

const BASE_URL = process.env.USER_AUTH_BASE_URL;

export default async function AdminHome({ username }: UserHomeProps) {
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
    <main className={'flex flex-col min-h-screen items-center gap-2'}>
      <h1 className={'text-4xl font-bold pt-6'}>
        Account Status for {username}
      </h1>
      <UserManager users={usersAndRoles} />
    </main>
  );
}
