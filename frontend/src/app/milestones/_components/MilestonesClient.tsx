'use client';

import Loading from '@/app/milestones/loading';

import { Button } from '@/components/ui/button';
import DatetimePicker from '@/app/milestones/_components/DatetimePicker';
import { Input } from '@/components/ui/input';
import useMilestones from '@/hooks/milestones/useMilestones';
import Navbar from '@/app/_components/Navbar';

export default function MilestonesClient({ username }: { username: string }) {
  const {
    date,
    setDate,
    name,
    setName,
    milestones,
    getLocalDateDisplay,
    isLoaded,
    milestoneToKey,
    isSyncing,
    syncMilestones,
    db,
  } = useMilestones();

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <div className='flex min-h-dvh flex-col justify-center'>
      <Navbar />
      <div className='flex w-full grow flex-col bg-background-kp pt-8'>
        <h3 className='text-center text-3xl font-bold'>'{username}'</h3>
        <div className='flex justify-center'>
          <Button
            variant={'secondary'}
            disabled={isSyncing}
            onClick={syncMilestones}
          >
            Sync
          </Button>
        </div>
        <div className='mx-auto flex w-full max-w-lg flex-col gap-4'>
          {milestones.length > 0 ? (
            milestones.map((m) => {
              const utcDate = new Date(m.timestamp);
              return (
                <div
                  key={milestoneToKey(m)}
                  className='flex justify-between gap-2'
                >
                  <p>
                    {m.name} - {getLocalDateDisplay(utcDate, m.timezone)} - (
                    {getDiffInDays(utcDate)})
                  </p>
                  <Button
                    variant={'destructive'}
                    onClick={() => db.removeMilestone(m)}
                    disabled={isSyncing}
                  >
                    Remove
                  </Button>
                </div>
              );
            })
          ) : (
            <p>No milestones entered</p>
          )}
        </div>
        <div className='flex w-full flex-col items-center gap-2'>
          <h3>Pick a thing</h3>
          <div className='flex w-full max-w-lg flex-col items-center gap-2'>
            <Input
              type='text'
              onChange={(e) => setName(e.target.value || '')}
              value={name}
              disabled={isSyncing}
            />
            <DatetimePicker
              date={date}
              setDate={setDate}
              disabled={isSyncing}
            />
            <Button
              className='h-10'
              variant={'secondary'}
              onClick={db.addCurrentMilestone}
              disabled={isSyncing}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const getDiffInDays = (date: Date) =>
  Math.max(
    Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    0
  );
