import { UserHomeProps } from '@/app/account/home/page';

export default async function AdminHome({ username }: UserHomeProps) {
  const content = 'Hello';
  return (
    <main className={'flex flex-col min-h-screen items-center gap-2'}>
      <h1 className={'text-4xl font-bold pt-6'}>
        Account Status for {username}
      </h1>
      <p className={'text-lg text-purple-400'}>{content}</p>
    </main>
  );
}
