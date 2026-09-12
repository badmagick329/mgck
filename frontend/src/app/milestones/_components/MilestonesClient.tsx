'use client';
import Loading from '@/app/milestones/loading';
import useMilestones from '@/hooks/milestones/useMilestones';
import Navbar from '@/app/_components/Navbar';
import MilestonesComparison from './MilestonesComparison';
import MilestonesInput from './MilestonesInput';
import { useToast } from '@/components/ui/use-toast';
import { MilestoneAccount } from '@/lib/types/milestones';
import { useEffect, useRef, useState } from 'react';
import '../milestones.css';

export default function MilestonesClient({
  account,
}: {
  account: MilestoneAccount | null;
}) {
  const {
    store,
    syncStatus,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  } = useMilestones(account);
  const { toast } = useToast();
  const shownWarning = useRef<string | null>(null);
  const [adding, setAdding] = useState(false);
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
  if (!store.isLoaded) return <Loading />;
  return (
    <main className='milestones-page'>
      <Navbar className='bg-background-lighter-ml' />
      <div className='milestones-content'>
        <header className='milestones-header'>
          <div>
            <h1>Milestones</h1>
            <p>See the time between now and what matters to you.</p>
          </div>
          <button
            className='milestones-add'
            aria-expanded={adding || store.milestones.length === 0}
            aria-controls='milestone-entry'
            onClick={() => setAdding(!adding)}
          >
            Add milestone
          </button>
        </header>
        {syncStatus === 'not-synced' && (
          <p className='milestones-sync' role='status'>
            Not synced — changes are saved on this device and will retry
            automatically.
          </p>
        )}
        {(adding || store.milestones.length === 0) && (
          <div id='milestone-entry'>
            <MilestonesInput
              createMilestone={createMilestone}
              onCreated={() => setAdding(false)}
            />
          </div>
        )}
        <MilestonesComparison
          store={store}
          updateMilestone={updateMilestone}
          deleteMilestone={deleteMilestone}
        />
        <footer className='milestones-footer'>
          <span>
            Milestones <span className='milestones-dot'>/</span> Make time
            tangible.
          </span>
        </footer>
      </div>
    </main>
  );
}
