'use client';

import Loading from '@/app/milestones/loading';

import useMilestones from '@/hooks/milestones/useMilestones';
import Navbar from '@/app/_components/Navbar';
import MilestonesDisplay from '@/app/milestones/_components/MilestonesDisplay';
import MilestonesChart from '@/app/milestones/_components/MilestonesChart';
import MilestonesInput from '@/app/milestones/_components/MilestonesInput';
import MilestonesSync from '@/app/milestones/_components/MilestonesSync';
import TimePeriodButtonGroup from '@/app/milestones/_components/TimePeriodButtonGroup';

export default function MilestonesClient({ username }: { username: string }) {
  const { state, db, milestonesConfig } = useMilestones(username);

  if (!state.isLoaded) {
    return <Loading />;
  }

  return (
    <div className='flex min-h-dvh flex-col justify-center bg-background-ml text-foreground-ml'>
      <Navbar className='bg-background-lighter-ml' />
      <div className='flex w-full grow flex-col justify-between gap-4 px-2 md:px-4 lg:px-8'>
        <div className='flex flex-col gap-4'>
          <h1 className='text-center text-3xl font-bold'>Milestones</h1>
          <MilestonesChart
            milestones={state.milestones}
            diffPeriod={milestonesConfig.diffPeriod}
            hiddenMilestones={state.hiddenMilestones}
          />
          <TimePeriodButtonGroup
            milestones={state.milestones}
            diffPeriod={milestonesConfig.diffPeriod}
            setDiffPeriod={state.setDiffPeriod}
          />
          <div className='flex flex-col justify-center gap-12'>
            <MilestonesDisplay
              milestones={state.milestones}
              isSyncing={state.isSyncing}
              updateMilestone={db.updateMilestone}
              deleteMilestone={db.deleteMilestone}
              diffPeriod={milestonesConfig.diffPeriod}
              hideMilestone={state.hideMilestone}
              unhideMilestone={state.unhideMilestone}
              isMilestoneHidden={state.isMilestoneHidden}
            />
            <MilestonesInput
              state={state}
              addCurrentMilestone={db.addCurrentMilestone}
            />
          </div>
        </div>
        <MilestonesSync
          state={state}
          db={db}
          isUsingServer={milestonesConfig.milestonesOnServer}
        />
      </div>
    </div>
  );
}
