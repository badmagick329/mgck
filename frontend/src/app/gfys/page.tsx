import { ThemeToggler } from '@/components/theme-toggler';

import Gfys from './_components/gfys-comp';

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center'>
      <div className='flex w-full justify-end px-2 pt-2'>
        <ThemeToggler />
      </div>
      <div className='py-4'></div>
      <div className='h-full w-full'>
        <Gfys />
      </div>
    </main>
  );
}
