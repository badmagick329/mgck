import {
  ACCEPTED_USER_ROLE,
  ADMIN_ROLE,
  NEW_USER_ROLE,
} from '@/lib/consts/auth';
import { redirect } from 'next/navigation';
import { ACCOUNT_LOGIN } from '@/lib/consts/urls';
import AdminHome from '@/app/account/home/_components/AdminHome';
import UserHome from '@/app/account/home/_components/UserHome';
import { ParsedToken } from '@/lib/account/parsed-token';

const EMOJIS = [
  '😃',
  '🥰',
  '😍',
  '🤓',
  '🤯',
  '😯',
  '🫣',
  '😳',
  '👀',
  '🔥',
  '🤪',
  '😎',
  '😏',
  '🤠',
];

export type UserHomeProps = {
  username: string;
  role: string;
};

export default async function Home() {
  const parsed = ParsedToken.createFromCookie();
  const role = parsed.role();
  const username = parsed.name();
  if (!parsed) {
    redirect(ACCOUNT_LOGIN);
  }

  if (role === ADMIN_ROLE) {
    return <AdminHome username={username} />;
  }

  if (role === ACCEPTED_USER_ROLE || role === NEW_USER_ROLE) {
    return (
      <UserHome
        username={username}
        status={role === NEW_USER_ROLE ? 'pending' : 'approved'}
        emojis={EMOJIS}
        features={[
          {
            name: 'Emojifier',
            href: '/emojify',
            description: 'Use AI to empower your text with emojis',
          },
        ]}
      />
    );
  }

  {
    // TODO: Improve this. This might show briefly while the user is being redirected after logout
  }
  return <p>...</p>;
}
