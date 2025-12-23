'use client';

import Loading from '@/app/milestones/loading';

import { Button } from '@/components/ui/button';
import DatetimePicker from '@/app/milestones/_components/DatetimePicker';
import { Input } from '@/components/ui/input';
import useMilestones from '@/hooks/milestones/useMilestones';
import Navbar from '@/app/_components/Navbar';
import MilestonesDisplay from '@/app/milestones/_components/MilestonesDisplay';
import ColorPicker from '@/app/milestones/_components/ColorPicker';

export default function MilestonesClient({ username }: { username: string }) {
  const { state, db } = useMilestones(username);

  if (!state.isLoaded) {
    return <Loading />;
  }

  return (
    <div className='flex min-h-dvh flex-col justify-center'>
      <Navbar />
      <div className='flex w-full grow flex-col gap-8 bg-background-kp pt-8'>
        <div className='flex justify-center gap-2'>
          <Button
            variant={'secondary'}
            disabled={state.isSyncing}
            onClick={
              state.isUsingServer
                ? state.unlinkFromServer
                : db.applyChangesToServerAndLink
            }
          >
            {state.isUsingServer
              ? 'Unlink from server'
              : 'Save changes to server'}
          </Button>
          {!state.isUsingServer && (
            <Button
              variant={'secondary'}
              disabled={state.isSyncing}
              onClick={db.retrieveChangesFromServerAndLink}
            >
              Retrieve changes from server
            </Button>
          )}
        </div>
        <div className='flex w-full flex-col items-center gap-2'>
          <h3>Enter a thing</h3>
          <div className='flex w-full max-w-lg flex-col items-center gap-2'>
            <div className='flex w-full items-center gap-2'>
              <Input
                type='text'
                onChange={(e) => state.setName(e.target.value || '')}
                value={state.name}
                disabled={state.isSyncing}
              />
              <ColorPicker
                color={state.color}
                handleColorChange={state.handleColorChange}
              />
            </div>
            <DatetimePicker
              date={state.date}
              setDate={state.setDate}
              disabled={state.isSyncing}
            />
            <Button
              className='h-10'
              variant={'secondary'}
              onClick={db.addCurrentMilestone}
              disabled={state.isSyncing}
            >
              Add
            </Button>
          </div>
        </div>
        <MilestonesDisplay
          milestones={state.milestones}
          isSyncing={state.isSyncing}
          removeMilestone={db.removeMilestone}
        />
      </div>
    </div>
  );
}
