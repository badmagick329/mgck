'use client';

import Loading from '@/app/milestones/loading';

import useMilestones from '@/hooks/milestones/useMilestones';
import Navbar from '@/app/_components/Navbar';
import MilestonesDisplay from '@/app/milestones/_components/MilestonesDisplay';
import MilestonesChart from '@/app/milestones/_components/MilestonesChart';
import MilestonesInput from '@/app/milestones/_components/MilestonesInput';
import MilestonesSync from '@/app/milestones/_components/MilestonesSync';
import TimePeriodButtonGroup from '@/app/milestones/_components/TimePeriodButtonGroup';
import MilestonesHeading from '@/app/milestones/_components/MilestonesHeading';
import Footer from '@/app/_components/Footer';

export default function MilestonesClient({ username }: { username: string }) {
  const {
    visibility,
    store,
    server,
    isSyncing,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  } = useMilestones(username);

  if (!store.isLoaded) {
    return <Loading />;
  }

  return (
    <div className='flex min-h-dvh flex-col justify-center bg-background-ml text-foreground-ml'>
      <Navbar className='bg-background-lighter-ml' />
      <div className='flex w-full grow flex-col justify-between gap-4 px-2 md:px-4'>
        <div className='flex flex-col gap-4 pt-8'>
          <MilestonesHeading />
          <MilestonesChart
            milestones={store.milestones}
            diffPeriod={store.config.diffPeriod}
            hiddenMilestones={visibility.hiddenMilestones}
          />
          {store.milestones.length > 0 && (
            <TimePeriodButtonGroup
              diffPeriod={store.config.diffPeriod}
              setDiffPeriod={store.setDiffPeriod}
            />
          )}
          <div className='flex flex-col justify-center gap-12'>
            <MilestonesDisplay
              milestones={store.milestones}
              isSyncing={isSyncing}
              updateMilestone={updateMilestone}
              deleteMilestone={deleteMilestone}
              diffPeriod={store.config.diffPeriod}
              visibility={visibility}
            />
            <MilestonesInput
              isSyncing={isSyncing}
              createMilestone={createMilestone}
            />
          </div>
        </div>
        <MilestonesSync
          isSyncing={isSyncing}
          isUsingServer={store.config.milestonesOnServer}
          server={server}
        />
      </div>
      <Footer />
    </div>
  );
}
