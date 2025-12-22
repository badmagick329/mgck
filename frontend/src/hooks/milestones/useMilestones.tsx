'use client';

import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ClientMilestone, clientMilestoneSchema } from '@/lib/types/milestones';
import { useEffect, useState } from 'react';
import { fromZonedTime, format } from 'date-fns-tz';
import {
  createMilestoneAction,
  listMilestonesAction,
  removeMilestoneAction,
} from '@/actions/milestones';
import { useRouter } from 'next/navigation';
import { ApiErrorResponse } from '@/lib/types';

const toastDuration = 4000;

export default function useMilestones(username: string) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState('');
  const { toast } = useToast();
  const {
    value: milestones,
    updateValue: setMilestones,
    isLoaded,
  } = useLocalStorage<ClientMilestone[]>('milestones', []);
  const {
    value: isUsingServer,
    updateValue: setIsUsingServer,
    isLoaded: isMilestonesSyncedLoaded,
  } = useLocalStorage('milestonesOnServer', false);

  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isUsingServer) {
      return;
    }

    if (!username) {
      router.push('/account');
      return;
    }

    (async () => {
      try {
        setIsSyncing(true);
        const result = await listMilestonesAction();
        result.ok ? setMilestones(result.data) : setIsUsingServer(false);
      } finally {
        setIsSyncing(false);
      }
    })();
  }, []);

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

    if (isUsingServer) {
      try {
        setIsSyncing(true);
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
        const result = await createMilestoneAction(parsed.data);
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
      } finally {
        setIsSyncing(false);
      }
    } else {
      try {
        setIsSyncing(true);
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

        const clientMilestone = parsed.data;

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
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const removeMilestone = async (milestoneName: string) => {
    if (isUsingServer) {
      try {
        setIsSyncing(true);
        const result = await removeMilestoneAction(milestoneName);
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
      } finally {
        setIsSyncing(false);
        return;
      }
    } else {
      setIsSyncing(true);
      setMilestones(
        milestones
          .filter((m) => milestoneName !== m.name)
          .sort((a, b) => a.timestamp - b.timestamp)
      );
      setIsSyncing(false);
    }
  };

  const applyChangesToServerAndLink = async () => {
    try {
      setIsSyncing(true);
      const safeMilestones = [] as ClientMilestone[];
      milestones.forEach((m) => {
        const parsed = clientMilestoneSchema.safeParse(m);
        if (parsed.error) {
          return toast({
            variant: 'destructive',
            title: 'Invalid milestone in local storage',
            description: `Please fix or remove the milestone "${m.name}" before syncing.`,
            duration: toastDuration,
          });
        }
        safeMilestones.push(parsed.data);
      });
      const result = await listMilestonesAction();
      if (!result.ok) {
        return toast({
          variant: 'destructive',
          title: 'Error syncing milestones',
          description: `${result.error}`,
          duration: toastDuration,
        });
      }
      const serverMilestoneNames = result.data!.map((m) => m.name);
      const newMilestones = safeMilestones.filter(
        (m) => !serverMilestoneNames.includes(m.name)
      );

      const clientMilestoneNames = safeMilestones.map((m) => m.name);
      const milestoneNamesToRemove = serverMilestoneNames.filter(
        (n) => !clientMilestoneNames.includes(n)
      );
      if (newMilestones.length === 0 && milestoneNamesToRemove.length === 0) {
        setIsUsingServer(true);
        return;
      }

      const createResults = [] as ApiErrorResponse[];
      for (const m of newMilestones) {
        const result = await createMilestoneAction(m);
        if (!result.ok) {
          createResults.push(result);
        }
      }
      const deleteResults = [] as ApiErrorResponse[];
      for (const name of milestoneNamesToRemove) {
        const result = await removeMilestoneAction(name);
        if (!result.ok) {
          deleteResults.push(result);
        }
      }

      createResults.forEach((r) => console.error(r.error));
      deleteResults.forEach((r) => console.error(r.error));

      const newResult = await listMilestonesAction();
      if (newResult.ok) {
        setMilestones(newResult.data);
      }
      setIsUsingServer(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const retrieveChangesFromServerAndLink = async () => {
    try {
      setIsSyncing(true);
      const result = await listMilestonesAction();
      if (!result.ok) {
        return toast({
          variant: 'destructive',
          title: 'Error retrieving milestones from server',
          description: `${result.error}`,
          duration: toastDuration,
        });
      }
      setMilestones(result.data);
      setIsUsingServer(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const unlinkFromServer = () => {
    try {
      setIsSyncing(true);
      setIsUsingServer(false);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    state: {
      date,
      setDate,
      name,
      setName,
      isLoaded: isLoaded && isMilestonesSyncedLoaded,
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
