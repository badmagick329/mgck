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
  const [isSyncing, setIsSyncing] = useState(false);

  const milestones = localMilstones;
  const setMilestones = setLocalMilestones;

  const addCurrentMilestone = () => {
    if (!name || !date) {
      return toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please provide both a name and a date.',
        duration: toastDuration,
      });
    }
    const trimmedName = name.trim();
    if (milestones.map((m) => m.name).includes(trimmedName)) {
      return toast({
        variant: 'destructive',
        title: 'Milestone already exists',
        description: `A milestone with the name "${trimmedName}" already exists.`,
        duration: toastDuration,
      });
    }

    const { utcDate, timezone } = getUtcDate(date);
    const utcTimestamp = utcDate.getTime();
    const diffInDays = getDiffInDays(utcDate);
    if (diffInDays < 1) {
      return toast({
        variant: 'destructive',
        title: 'Invalid date',
        description: 'Please select a date in the future.',
        duration: toastDuration,
      });
    }

    setName('');
    setMilestones(
      [
        ...milestones,
        {
          name: trimmedName,
          timestamp: utcTimestamp,
          timezone,
        },
      ].sort((a, b) => a.timestamp - b.timestamp)
    );
    return toast({
      title: 'Milestone added',
      description: `Milestone "${trimmedName}" added for ${date.toLocaleDateString()}.`,
      duration: toastDuration,
    });
  };

  const removeMilestone = (m: Milestone) => {
    setMilestones(
      milestones
        .filter((milestone) => milestoneToKey(m) !== milestoneToKey(milestone))
        .sort((a, b) => a.timestamp - b.timestamp)
    );
  };

  const syncMilestones = async () => {
    console.log('syncing');
    setIsSyncing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsSyncing(false);
    console.log('done');
  };

  const listMilestones = async () => {};

  return {
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
    db: {
      removeMilestone,
      addCurrentMilestone,
    },
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

const getDiffInDays = (date: Date) =>
  Math.max(
    Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    0
  );
