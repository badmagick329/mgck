import { UserHomeProps } from '@/app/account/home/page';
import LogoutButton from './LogoutButton';

export default async function NewUserHome({ username }: UserHomeProps) {
  const content = 'You have registered. Please wait for approval';
  return (
    <main className={'flex flex-col min-h-screen items-center gap-2'}>
      <h1 className={'text-4xl font-bold pt-6'}>
        Account Status for {username}
      </h1>
      <LogoutButton />
      <p className={'text-lg text-yellow-400'}>{content}</p>
    </main>
  );
}
