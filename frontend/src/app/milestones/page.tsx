'use client';

import Loading from '@/app/milestones/loading';
import useLocalStorage from '@/hooks/useLocalStorage';

import { Button } from '@/components/ui/button';
import DatetimePicker from '@/app/milestones/_components/DatetimePicker';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function MilestoneHome() {
  const {
    value: message,
    updateValue: setMessage,
    isLoaded,
  } = useLocalStorage('message', 'No saved message');

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState('');

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <div className='flex min-h-screen flex-col items-center gap-4 bg-background-kp pt-8'>
      <p>Your saved message: {message}</p>
      <input
        type='text'
        onChange={(e) => setMessage(e.target.value || 'No saved message')}
      />
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
              if (!name) {
                return;
              }
              setDate(undefined);
              setName('');
              console.log('Add milestone', { name, date });
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
