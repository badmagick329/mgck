import { CgSpinnerTwo } from 'react-icons/cg';

// The (listing) group scopes this boundary to /gfys. Above /gfys/[videoId] it
// would flush a 200 shell before the page's notFound() could set a 404, and
// blocking metadata (htmlLimitedBots) already holds that shell for fetchGfy.

export default function Loading() {
  return (
    <div className='bg-background-gf dark:bg-background-gf-dark flex min-h-screen w-full flex-col items-center justify-center'>
      <CgSpinnerTwo className='animate-spin text-6xl' />
    </div>
  );
}
