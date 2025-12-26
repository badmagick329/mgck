'use client';

import { useToast } from '@/components/ui/use-toast';
import useLocalStorage from '@/hooks/useLocalStorage';
import {
  ClientMilestone,
  clientMilestoneSchema,
  DiffPeriod,
  MilestonesConfig,
} from '@/lib/types/milestones';
import { useState } from 'react';
import useSyncOperation from '@/hooks/milestones/useSyncOperation';
import useMilestoneSyncAdaptor from '@/hooks/milestones/useMilestonesSync';
import useMilestonesServer from '@/hooks/milestones/useMilestonesServer';
import useDebounceInput from '@/hooks/useDebounceInput';
import { DEFAULT_COLOR } from '@/lib/consts/milestones';
import useMilestoneVisibility from '@/hooks/milestones/useMilestoneVisibility';

const toastDuration = 4000;

export default function useMilestones(username: string) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState('');
  const { value: color, handleChange: handleColorChange } = useDebounceInput({
    defaultValue: DEFAULT_COLOR,
    delay: 100,
  });
  const {
    value: milestones,
    updateValue: setMilestones,
    isLoaded,
  } = useLocalStorage<ClientMilestone[]>('milestones', []);
  const {
    value: milestonesConfig,
    updateValue: setMilestonesConfig,
    isLoaded: isConfigLoaded,
  } = useLocalStorage<MilestonesConfig>('milestonesConfig', {
    milestonesOnServer: false,
    diffPeriod: 'days',
  });

  const { isSyncing, execute } = useSyncOperation();

  const {
    applyChangesToServerAndLink,
    retrieveChangesFromServerAndLink,
    unlinkFromServer,
  } = useMilestonesServer({
    execute,
    milestones,
    setMilestones,
    toast,
    toastDuration,
    milestonesConfig: milestonesConfig,
    setMilestonesConfig,
  });

  const { create, delete_, update } = useMilestoneSyncAdaptor(
    milestonesConfig.milestonesOnServer,
    milestones
  );
  const {
    hiddenMilestones,
    hideMilestone,
    unhideMilestone,
    isMilestoneHidden,
  } = useMilestoneVisibility();
  const addCurrentMilestone = async () => {
    if (!name.trim() || !date) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please provide both a name and a date.',
        duration: toastDuration,
      });
      return {
        ok: false as const,
        error: 'Please provide both a name and a date.',
      };
    }
    const exists = milestones.filter((m) => m.name === name.trim()).length > 0;
    if (exists) {
      toast({
        variant: 'destructive',
        title: 'Duplicate milestone',
        description: 'A milestone with this name already exists.',
        duration: toastDuration,
      });
      return {
        ok: false as const,
        error: 'A milestone with this name already exists.',
      };
    }

    const fn = async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const currentMilestone = {
        name,
        timestamp: date.getTime(),
        timezone,
        color,
      };
      const parsed = clientMilestoneSchema.safeParse(currentMilestone);
      if (parsed.error) {
        toast({
          variant: 'destructive',
          title: 'Invalid milestone',
          description: `${parsed.error.errors[0].message}`,
          duration: toastDuration,
        });
        return {
          ok: false as const,
          error: `${parsed.error.errors[0].message}`,
        };
      }
      const result = await create(parsed.data);
      if (!result.ok) {
        toast({
          variant: 'destructive',
          title: 'Error adding milestone',
          description: `${result.error}`,
          duration: toastDuration,
        });
        return { ok: false as const, error: `${result.error}` };
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
            color,
          },
        ].sort((a, b) => a.timestamp - b.timestamp)
      );
      toast({
        title: 'Milestone added',
        description: `Milestone "${clientMilestone.name}" added for ${new Date(clientMilestone.timestamp).toLocaleDateString()}.`,
        duration: toastDuration,
      });
      return { ok: true as const };
    };
    return execute(fn);
  };

  const deleteMilestone = async (milestoneName: string) => {
    execute(async () => {
      const result = await delete_(milestoneName);
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
      unhideMilestone(milestoneName);
    });
  };
  const setDiffPeriod = (period: DiffPeriod) => {
    setMilestonesConfig({ ...milestonesConfig, diffPeriod: period });
  };

  const updateMilestone = async (
    milestoneName: string,
    newMilestone: Partial<ClientMilestone>
  ) => {
    return execute(async () => {
      const result = await update(milestoneName, newMilestone);
      if (!result.ok) {
        toast({
          variant: 'destructive',
          title: 'Error updating milestone',
          description: `${result.error}`,
          duration: toastDuration,
        });
        return {
          ok: false,
          error: result.error,
        };
      }

      setMilestones(
        milestones.map((m) => (m.name === milestoneName ? result.data : m))
      );
      if (
        newMilestone.name &&
        milestoneName !== newMilestone.name &&
        isMilestoneHidden(milestoneName)
      ) {
        unhideMilestone(milestoneName);
        hideMilestone(newMilestone.name);
      }
      return {
        ok: true,
      };
    });
  };

  return {
    state: {
      date,
      setDate,
      name,
      setName,
      isLoaded: isLoaded && isConfigLoaded,
      isSyncing,
      milestones,
      unlinkFromServer,
      color,
      handleColorChange,
      setDiffPeriod,
      hiddenMilestones,
      hideMilestone,
      unhideMilestone,
      isMilestoneHidden,
    },
    milestonesConfig,
    db: {
      deleteMilestone,
      addCurrentMilestone,
      applyChangesToServerAndLink,
      retrieveChangesFromServerAndLink,
      updateMilestone,
    },
  };
}
