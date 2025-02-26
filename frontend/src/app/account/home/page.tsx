import {
  ACCEPTED_USER_ROLE,
  ADMIN_ROLE,
  NEW_USER_ROLE,
} from '@/lib/types/auth';
import { redirect } from 'next/navigation';
import { ACCOUNT_LOGIN } from '@/lib/consts/urls';
import AdminHome from '@/app/account/home/_components/AdminHome';
import AcceptedUserHome from '@/app/account/home/_components/AcceptedUserHome';
import NewUserHome from '@/app/account/home/_components/NewUserHome';
import { ParsedToken } from '@/lib/account/parsed-token';

export type UserHomeProps = {
  username: string;
  role: string;
};

export default async function Home() {
  const parsed = ParsedToken.createFromCookie();
  if (!parsed) {
    redirect(ACCOUNT_LOGIN);
  }

  if (parsed.role() === ADMIN_ROLE) {
    return <AdminHome username={parsed.name()} role={parsed.role()} />;
  }

  if (parsed.role() === ACCEPTED_USER_ROLE) {
    return <AcceptedUserHome username={parsed.name()} role={parsed.role()} />;
  }

  if (parsed.role() === NEW_USER_ROLE) {
    return <NewUserHome username={parsed.name()} role={parsed.role()} />;
  }

  {
    // TODO: Improve this
  }
  return <p>It appears you have not been assigned a role. Contact the admin</p>;
}
