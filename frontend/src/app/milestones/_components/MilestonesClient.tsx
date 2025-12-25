'use client';

import Loading from '@/app/milestones/loading';

import useMilestones from '@/hooks/milestones/useMilestones';
import Navbar from '@/app/_components/Navbar';
import MilestonesDisplay from '@/app/milestones/_components/MilestonesDisplay';
import MilestonesChart from '@/app/milestones/_components/MilestonesChart';
import MilestonesInput from '@/app/milestones/_components/MilestonesInput';
import MilestonesSync from '@/app/milestones/_components/MilestonesSync';
import { Separator } from '@/components/ui/separator';
import { ButtonGroup } from '@/components/ui/button-group';
import { MilestonesButton } from '@/components/ui/MilestonesButton';

export default function MilestonesClient({ username }: { username: string }) {
  const { state, db, milestonesConfig } = useMilestones(username);

  if (!state.isLoaded) {
    return <Loading />;
  }

  return (
    <div className='flex min-h-dvh flex-col justify-center bg-background-ml text-foreground-ml'>
      <Navbar className='bg-background-lighter-ml' />
      <div className='flex w-full grow flex-col gap-8 px-4 pt-8'>
        <div className='mx-auto flex w-full max-w-4xl grow flex-col justify-between gap-4'>
          <div className='flex flex-col gap-4'>
            <h1 className='text-center text-3xl font-bold'>Milestones</h1>

            <MilestonesChart
              milestones={state.milestones}
              diffPeriod={milestonesConfig.diffPeriod}
            />
            {state.milestones.length > 0 && (
              <>
                <div className='flex justify-center'>
                  <ButtonGroup>
                    <MilestonesButton
                      appVariant='milestonesSecondary'
                      onClick={() => state.setDiffPeriod('seconds')}
                      disabled={milestonesConfig.diffPeriod === 'seconds'}
                      className='font-semibold'
                    >
                      Seconds
                    </MilestonesButton>
                    <MilestonesButton
                      appVariant='milestonesSecondary'
                      onClick={() => state.setDiffPeriod('minutes')}
                      disabled={milestonesConfig.diffPeriod === 'minutes'}
                      className='font-semibold'
                    >
                      Minutes
                    </MilestonesButton>
                    <MilestonesButton
                      appVariant='milestonesSecondary'
                      onClick={() => state.setDiffPeriod('hours')}
                      disabled={milestonesConfig.diffPeriod === 'hours'}
                      className='font-semibold'
                    >
                      Hours
                    </MilestonesButton>
                    <MilestonesButton
                      appVariant='milestonesSecondary'
                      onClick={() => state.setDiffPeriod('days')}
                      disabled={milestonesConfig.diffPeriod === 'days'}
                      className='font-semibold'
                    >
                      Days
                    </MilestonesButton>
                    <MilestonesButton
                      appVariant='milestonesSecondary'
                      onClick={() => state.setDiffPeriod('weeks')}
                      disabled={milestonesConfig.diffPeriod === 'weeks'}
                      className='font-semibold'
                    >
                      Weeks
                    </MilestonesButton>
                  </ButtonGroup>
                </div>
                <Separator className='my-4' />
              </>
            )}
            <div className='flex flex-col justify-center gap-12'>
              <MilestonesDisplay
                milestones={state.milestones}
                isSyncing={state.isSyncing}
                updateMilestone={db.updateMilestone}
                deleteMilestone={db.deleteMilestone}
                diffPeriod={milestonesConfig.diffPeriod}
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
    </div>
  );
}
