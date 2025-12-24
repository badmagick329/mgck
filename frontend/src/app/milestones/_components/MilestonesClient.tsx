'use client';

import Loading from '@/app/milestones/loading';

import useMilestones from '@/hooks/milestones/useMilestones';
import Navbar from '@/app/_components/Navbar';
import MilestonesDisplay from '@/app/milestones/_components/MilestonesDisplay';
import MilestonesChart from '@/app/milestones/_components/MilestonesChart';
import MilestonesInput from '@/app/milestones/_components/MilestonesInput';
import MilestonesSync from '@/app/milestones/_components/MilestonesSync';
import { Separator } from '@/components/ui/separator';

export default function MilestonesClient({ username }: { username: string }) {
  const { state, db } = useMilestones(username);

  if (!state.isLoaded) {
    return <Loading />;
  }

  return (
    <div className='flex min-h-dvh flex-col justify-center'>
      <Navbar />
      <div className='flex w-full grow flex-col gap-8 bg-background-kp px-4 pt-8'>
        <div className='mx-auto flex w-full max-w-4xl grow flex-col justify-between gap-4'>
          <div className='flex flex-col gap-4'>
            <h1 className='text-center text-3xl font-bold'>Milestones</h1>

            <MilestonesChart milestones={state.milestones} />
            <Separator className='my-4' />
            <div className='flex flex-col justify-center gap-12 lg:grid lg:grid-cols-5'>
              <MilestonesInput
                state={state}
                addCurrentMilestone={db.addCurrentMilestone}
              />

              <MilestonesDisplay
                milestones={state.milestones}
                isSyncing={state.isSyncing}
                removeMilestone={db.removeMilestone}
              />
            </div>
          </div>
          <MilestonesSync state={state} db={db} />
        </div>
      </div>
    </div>
  );
}
