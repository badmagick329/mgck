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
import BackupRestore from '@/app/milestones/_components/BackupRestore';
import { useToast } from '@/components/ui/use-toast';
import { MilestoneAccount } from '@/lib/types/milestones';
import { useEffect, useRef } from 'react';

export default function MilestonesClient({
  account,
  automaticSyncEnabled,
}: {
  account: MilestoneAccount | null;
  automaticSyncEnabled: boolean;
}) {
  const {
    store,
    server,
    isSyncing,
    syncStatus,
    isUsingServer,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    restoreBackup,
  } = useMilestones(account, automaticSyncEnabled);
  const { toast } = useToast();
  const shownWarning = useRef<string | null>(null);

  useEffect(() => {
    const warningKey = store.loadWarning
      ? `${store.storageKey}:${store.loadWarning}`
      : null;
    if (warningKey && shownWarning.current !== warningKey) {
      shownWarning.current = warningKey;
      toast({
        title: 'Some milestone data could not be loaded',
        description: store.loadWarning,
        variant: 'destructive',
      });
    }
  }, [store.loadWarning, store.storageKey, toast]);

  if (!store.isLoaded) {
    return <Loading />;
  }

  return (
    <main className='flex min-h-dvh flex-col justify-center bg-background-ml text-foreground-ml'>
      <Navbar className='bg-background-lighter-ml' />
      <article className='flex w-full grow flex-col justify-between gap-4 px-2 md:px-4'>
        <section className='flex flex-col gap-4 pt-8'>
          <MilestonesHeading syncStatus={syncStatus} />
          <MilestonesChart
            milestones={store.milestones}
            diffPeriod={store.config.diffPeriod}
            hiddenMilestoneIds={store.hiddenMilestoneIds}
          />
          {store.milestones.length > 0 && (
            <TimePeriodButtonGroup
              diffPeriod={store.config.diffPeriod}
              setDiffPeriod={store.setDiffPeriod}
            />
          )}
          <section className='flex flex-col justify-center gap-12'>
            <MilestonesDisplay
              milestones={store.milestones}
              isSyncing={isSyncing}
              updateMilestone={updateMilestone}
              deleteMilestone={deleteMilestone}
              store={store}
            />
            <MilestonesInput
              isSyncing={isSyncing}
              createMilestone={createMilestone}
            />
          </section>
        </section>
        <MilestonesSync
          isSyncing={isSyncing}
          isUsingServer={isUsingServer}
          isAuthenticated={Boolean(account)}
          automaticSyncEnabled={automaticSyncEnabled}
          server={server}
        />
      </article>
      <BackupRestore store={store} restoreBackup={restoreBackup} />
      <Footer />
    </main>
  );
}
