'use client';

import Loading from '@/app/milestones/loading';
import useLocalStorage from '@/hooks/useLocalStorage';

import { Button } from '@/components/ui/button';
import DatetimePicker from '@/app/milestones/_components/DatetimePicker';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

const toastDuration = 4000;
type Milestone = { name: string; timestamp: number; timezone: string };

export default function MilestoneHome() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState('');
  const {
    value: milestones,
    updateValue: setMilestones,
    isLoaded,
  } = useLocalStorage<Milestone[]>('milestones', []);
  const { toast } = useToast();

  if (!isLoaded) {
    return <Loading />;
  }

  const handleAdd = () => {
    if (!name || !date) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please provide both a name and a date.',
        duration: toastDuration,
      });
      return;
    }
    const trimmedName = name.trim();
    if (milestones.map((m) => m.name).includes(trimmedName)) {
      toast({
        variant: 'destructive',
        title: 'Milestone already exists',
        description: `A milestone with the name "${trimmedName}" already exists.`,
        duration: toastDuration,
      });
      return;
    }

    const { utcDate, timezone } = getUtcDate(date);
    const utcTimestamp = utcDate.getTime();

    setName('');
    setMilestones([
      ...milestones,
      {
        name: trimmedName,
        timestamp: utcTimestamp,
        timezone,
      },
    ]);
    toast({
      title: 'Milestone added',
      description: `Milestone "${trimmedName}" added for ${date.toLocaleDateString()}.`,
      duration: toastDuration,
    });
  };

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
                  onClick={() => {
                    setMilestones(
                      milestones.filter(
                        (milestone) =>
                          milestoneToKey(m) !== milestoneToKey(milestone)
                      )
                    );
                  }}
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
          <Button className='h-10' variant={'secondary'} onClick={handleAdd}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function getUtcDate(date: Date) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const localDatetimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
  return {
    utcDate: fromZonedTime(localDatetimeString, timezone),
    timezone,
  };
}

function getLocalDateDisplay(date: Date, timezone: string) {
  return format(date, 'yyyy-MM-dd', {
    timeZone: timezone,
  });
}

function getDiffInDays(date: Date) {
  return Math.max(
    Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    0
  );
}
const milestoneToKey = (m: Milestone) => `${m.name}-${m.timestamp}`;
