import { CgSpinnerTwo } from 'react-icons/cg';

export default function Loading() {
  return (
    <div className='dark:bg-background-kp-dark flex min-h-screen w-full flex-col items-center justify-center bg-background-kp'>
      <CgSpinnerTwo className='animate-spin text-6xl' />
    </div>
  );
}
