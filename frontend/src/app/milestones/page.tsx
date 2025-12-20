'use client';

import Loading from '@/app/milestones/loading';
import useLocalStorage from '@/hooks/useLocalStorage';

import { Button } from '@/components/ui/button';
import DatetimePicker from '@/app/milestones/_components/DatetimePicker';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const toastDuration = 4000;

export default function MilestoneHome() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState('');
  const {
    value: milestones,
    updateValue: setMilestones,
    isLoaded,
  } = useLocalStorage<{ name: string; timestamp: number }[]>('milestones', []);
  const { toast } = useToast();

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <div className='flex min-h-screen flex-col items-center gap-4 bg-background-kp pt-8'>
      <div className='flex flex-col gap-2'>
        {milestones.length > 0 ? (
          milestones.map((m) => {
            return (
              <p key={`${m.name}-${m.timestamp}`}>
                {m.name} - {new Date(m.timestamp).toLocaleDateString()}
              </p>
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
            onClick={() => {
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
              setName('');
              setMilestones([
                ...milestones,
                {
                  name: trimmedName,
                  timestamp: date.getTime(),
                },
              ]);
              toast({
                title: 'Milestone added',
                description: `Milestone "${trimmedName}" added for ${date.toLocaleDateString()}.`,
                duration: toastDuration,
              });
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
