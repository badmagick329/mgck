'use client';

import Loading from '@/app/milestones/loading';

import { Button } from '@/components/ui/button';
import DatetimePicker from '@/app/milestones/_components/DatetimePicker';
import { Input } from '@/components/ui/input';
import useMilestones from '@/hooks/milestones/useMilestones';

export default function MilestoneHome() {
  const {
    date,
    setDate,
    name,
    setName,
    milestones,
    addCurrentMilestone,
    removeMilestone,
    getLocalDateDisplay,
    isLoaded,
    milestoneToKey,
  } = useMilestones();

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <div className='flex min-h-screen flex-col items-center gap-4 bg-background-kp pt-8'>
      <div className='flex flex-col gap-2'>
        {milestones.length > 0 ? (
          milestones.map((m) => {
            const utcDate = new Date(m.timestamp);
            return (
              <div key={milestoneToKey(m)} className='flex gap-2'>
                <p>
                  {m.name} - {getLocalDateDisplay(utcDate, m.timezone)} - (
                  {getDiffInDays(utcDate)})
                </p>
                <Button
                  variant={'destructive'}
                  onClick={() => removeMilestone(m)}
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
      <div className='flex flex-col gap-2'>
        <h3>Pick a thing</h3>
        <div className='flex gap-2'>
          <Input
            type='text'
            onChange={(e) => setName(e.target.value || '')}
            value={name}
          />
          <DatetimePicker date={date} setDate={setDate} />
          <Button
            className='h-10'
            variant={'secondary'}
            onClick={addCurrentMilestone}
          >
            Add
          </Button>
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
