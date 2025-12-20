'use client';

import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Milestone } from '@/lib/types/milestones';
import { useState } from 'react';
import { fromZonedTime, format } from 'date-fns-tz';

const toastDuration = 4000;

export default function useMilestones() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState('');
  const { toast } = useToast();
  const {
    value: localMilstones,
    updateValue: setLocalMilestones,
    isLoaded,
  } = useLocalStorage<Milestone[]>('milestones', []);
  const milestones = localMilstones;
  const setMilestones = setLocalMilestones;

  const addCurrentMilestone = () => {
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
  const removeMilestone = (m: Milestone) => {
    setMilestones(
      milestones.filter(
        (milestone) => milestoneToKey(m) !== milestoneToKey(milestone)
      )
    );
  };

  return {
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
  };
}

const getUtcDate = (date: Date) => {
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
};

const milestoneToKey = (m: Milestone) => `${m.name}-${m.timestamp}`;

const getLocalDateDisplay = (date: Date, timezone: string) =>
  format(date, 'yyyy-MM-dd', {
    timeZone: timezone,
  });
