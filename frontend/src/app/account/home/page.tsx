import {
  ACCEPTED_USER_ROLE,
  ADMIN_ROLE,
  NEW_USER_ROLE,
} from '@/lib/consts/account';
import { redirect } from 'next/navigation';
import { ACCOUNT_LOGIN } from '@/lib/consts/urls';
import AdminHome from '@/app/account/home/_components/AdminHome';
import UserHome from '@/app/account/home/_components/UserHome';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import { CgSpinnerTwo } from 'react-icons/cg';

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
  const session = await getVerifiedCoreSession();
  if (!session) {
    redirect(ACCOUNT_LOGIN);
  }
  const { role, username } = session;

  if (role === ADMIN_ROLE) {
    return <AdminHome username={username} />;
  }

  if (role === ACCEPTED_USER_ROLE || role === NEW_USER_ROLE) {
    return (
      <UserHome
        username={username}
        isApproved={role === ACCEPTED_USER_ROLE}
        emojis={EMOJIS}
        features={[
          {
            name: 'Emojifier',
            href: '/emojify',
            description: 'Use AI to empower your text with emojis',
          },
          {
            name: 'URL Shortener',
            href: '/shorten',
            description: 'Shorten your URLs and track their useage',
          },
        ]}
      />
    );
  }

  return (
    <div className='flex w-full grow justify-center bg-background-kp pt-8'>
      <CgSpinnerTwo className='animate-spin text-6xl' />
    </div>
  );
}
