'use client';

import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ClientMilestone, clientMilestoneSchema } from '@/lib/types/milestones';
import { useState } from 'react';
import { fromZonedTime, format } from 'date-fns-tz';
import useSyncOperation from '@/hooks/milestones/useSyncOperation';
import useMilestoneSyncAdaptor from '@/hooks/milestones/useMilestonesSync';
import useMilestonesServer from '@/hooks/milestones/useMilestonesServer';

const toastDuration = 4000;

export default function useMilestones(username: string) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState('');
  const {
    value: milestones,
    updateValue: setMilestones,
    isLoaded,
  } = useLocalStorage<ClientMilestone[]>('milestones', []);

  const { isSyncing, execute } = useSyncOperation();

  const {
    isUsingServer,
    isServerMilestonesLoaded,
    applyChangesToServerAndLink,
    retrieveChangesFromServerAndLink,
    unlinkFromServer,
  } = useMilestonesServer({
    execute,
    milestones,
    setMilestones,
    toast,
    toastDuration,
    isUserLoggedIn: username !== '',
  });

  const { create, remove } = useMilestoneSyncAdaptor(isUsingServer, milestones);

  const addCurrentMilestone = async () => {
    if (!name.trim() || !date) {
      return toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please provide both a name and a date.',
        duration: toastDuration,
      });
    }
    const exists = milestones.filter((m) => m.name === name.trim()).length > 0;
    if (exists) {
      return toast({
        variant: 'destructive',
        title: 'Duplicate milestone',
        description: 'A milestone with this name already exists.',
        duration: toastDuration,
      });
    }

    execute(async () => {
      const { utcDate, timezone } = getUtcDate(date);
      const currentMilestone = {
        name,
        timestamp: utcDate.getTime(),
        timezone,
      };
      const parsed = clientMilestoneSchema.safeParse(currentMilestone);
      if (parsed.error) {
        return toast({
          variant: 'destructive',
          title: 'Invalid milestone',
          description: `${parsed.error}`,
          duration: toastDuration,
        });
      }
      const result = await create(parsed.data);
      if (!result.ok) {
        return toast({
          variant: 'destructive',
          title: 'Error adding milestone',
          description: `${result.error}`,
          duration: toastDuration,
        });
      }

      const clientMilestone = result.data;
      setName('');
      setMilestones(
        [
          ...milestones,
          {
            name: clientMilestone.name,
            timestamp: clientMilestone.timestamp,
            timezone,
          },
        ].sort((a, b) => a.timestamp - b.timestamp)
      );
      return toast({
        title: 'Milestone added',
        description: `Milestone "${clientMilestone.name}" added for ${new Date(clientMilestone.timestamp).toLocaleDateString()}.`,
        duration: toastDuration,
      });
    });
  };

  const removeMilestone = async (milestoneName: string) => {
    execute(async () => {
      const result = await remove(milestoneName);
      if (!result.ok) {
        return toast({
          variant: 'destructive',
          title: 'Error removing milestone',
          description: `${result.error}`,
          duration: toastDuration,
        });
      }

      setMilestones(
        milestones
          .filter((m) => milestoneName !== m.name)
          .sort((a, b) => a.timestamp - b.timestamp)
      );
    });
  };

  return {
    state: {
      date,
      setDate,
      name,
      setName,
      isLoaded: isLoaded && isServerMilestonesLoaded,
      isSyncing,
      milestones,
      isUsingServer,
      unlinkFromServer,
    },
    getLocalDateDisplay,
    db: {
      removeMilestone,
      addCurrentMilestone,
      applyChangesToServerAndLink,
      retrieveChangesFromServerAndLink,
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

const getLocalDateDisplay = (date: Date, timezone: string) =>
  format(date, 'yyyy-MM-dd', {
    timeZone: timezone,
  });

const getDiffInDays = (date: Date) =>
  Math.max(
    Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    0
  );
