import { UserHomeProps } from '@/app/account/home/page';
import LogoutButton from './LogoutButton';
import Link from 'next/link';

export default async function AcceptedUserHome({ username }: UserHomeProps) {
  const content = 'You have been accepted. You can now access the following';
  return (
    <main className={'flex flex-col min-h-screen items-center gap-4'}>
      <h1 className={'text-4xl font-bold pt-6'}>
        Account Status for {username}
      </h1>
      <LogoutButton />
      <p className={'text-lg text-green-300'}>{content}</p>
      <ul className='pt-4'>
        <li>
          <Link className='text-lg hover:underline' href='/emojify'>
            AI Generation on the emojifier
          </Link>
        </li>
      </ul>
    </main>
  );
}
