import FilesAccessRequestForm from './request-form';
import Footer from '@/app/_components/Footer';
import Navbar from '@/app/_components/Navbar';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';

export default async function FilesAccessRequestPage() {
  const session = await getVerifiedCoreSession();
  return (
    <main className='flex min-h-dvh flex-col bg-slate-900 text-slate-50'>
      <Navbar />
      <div className='flex grow items-center justify-center px-4 py-10'>
        <FilesAccessRequestForm defaultUsername={session?.username || ''} />
      </div>
      <Footer />
    </main>
  );
}
