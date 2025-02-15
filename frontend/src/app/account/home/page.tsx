import { userRoleAction } from '@/actions/account';
import {
  ACCEPTED_USER_ROLE,
  ADMIN_ROLE,
  NEW_USER_ROLE,
  roleResponseSchema,
} from '@/lib/types/auth';
import { redirect } from 'next/navigation';
import { ACCOUNT_BASE } from '@/lib/consts/urls';
import AdminHome from '@/app/account/home/_components/AdminHome';
import AcceptedUserHome from '@/app/account/home/_components/AcceptedUserHome';
import NewUserHome from '@/app/account/home/_components/NewUserHome';

export type UserHomeProps = {
  username: string;
  role: string;
};

export default async function Home() {
  const response = await userRoleAction();
  const parsed = roleResponseSchema.safeParse(response);
  if (!parsed.success) {
    console.log(`Error: ${JSON.stringify(parsed.error.errors)}`);
    redirect(`${ACCOUNT_BASE}/login`);
  }
  console.log(`got role ${parsed.data.data.role}`);

  if (parsed.data.data.role === ADMIN_ROLE) {
    return (
      <AdminHome
        username={parsed.data.data.username}
        role={parsed.data.data.role}
      />
    );
  }

  if (parsed.data.data.role === ACCEPTED_USER_ROLE) {
    return (
      <AcceptedUserHome
        username={parsed.data.data.username}
        role={parsed.data.data.role}
      />
    );
  }

  if (parsed.data.data.role === NEW_USER_ROLE) {
    return (
      <NewUserHome
        username={parsed.data.data.username}
        role={parsed.data.data.role}
      />
    );
  }

  {
    // TODO: Improve this
  }
  return <p>It appears you have not been assigned a role. Contact the admin</p>;
}
