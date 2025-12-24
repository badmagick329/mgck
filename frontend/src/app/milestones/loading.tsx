import { CgSpinnerTwo } from 'react-icons/cg';

export default function Loading() {
  return (
    <div className='bg-background-ml flex min-h-screen w-full flex-col items-center justify-center'>
      <CgSpinnerTwo className='animate-spin text-6xl' />
    </div>
  );
}
