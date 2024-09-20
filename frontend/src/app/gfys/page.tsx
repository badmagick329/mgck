import Navbar from '@/components/navbar';

import Gfys from './_components/gfys-comp';

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center'>
      <Navbar />
      <div className='py-4'></div>
      <div className='h-full w-full'>
        <Gfys />
      </div>
    </main>
  );
}
