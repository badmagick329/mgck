'use client';

import { ClientMilestone, clientMilestoneSchema } from '@/lib/types/milestones';
import useSyncOperation from '@/hooks/milestones/useSyncOperation';
import useMilestoneSyncAdaptor from '@/hooks/milestones/useMilestonesSync';
import useMilestonesServer from '@/hooks/milestones/useMilestonesServer';
import useMilestoneStore from '@/hooks/milestones/useMilestoneStore';
import useOperationToast from '@/hooks/milestones/useOperationToast';

export default function useMilestones(username: string) {
  const store = useMilestoneStore();
  const { showError, showSuccess } = useOperationToast();
  const { isSyncing, execute } = useSyncOperation();

  const server = useMilestonesServer({
    execute,
    milestones: store.milestones,
    setMilestones: store.setMilestones,
    setServerLinked: store.setServerLinked,
  });

  const { create, delete_, update } = useMilestoneSyncAdaptor(
    store.config.milestonesOnServer,
    store.milestones
  );
  const visibility = {
    hiddenMilestones: store.hiddenMilestones,
    hideMilestone: store.hideMilestone,
    unhideMilestone: store.unhideMilestone,
    isMilestoneHidden: store.isMilestoneHidden,
    setHiddenMilestones: store.setHiddenMilestones,
  };

  const createMilestone = async ({
    name,
    date,
    color,
  }: {
    name: string;
    date: Date | undefined;
    color: string;
  }) => {
    if (!name.trim() || !date) {
      showError('Missing fields', 'Please provide both a name and a date.');
      return {
        ok: false as const,
        error: 'Please provide both a name and a date.',
      };
    }
    const exists =
      store.milestones.filter((m) => m.name === name.trim()).length > 0;
    if (exists) {
      showError(
        'Duplicate milestone',
        'A milestone with this name already exists.'
      );
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
        showError('Invalid milestone', `${parsed.error.errors[0].message}`);
        return {
          ok: false as const,
          error: `${parsed.error.errors[0].message}`,
        };
      }
      const result = await create(parsed.data);
      if (!result.ok) {
        showError('Error adding milestone', `${result.error}`);
        return { ok: false as const, error: `${result.error}` };
      }

      const clientMilestone = result.data;
      store.addMilestone(clientMilestone);

      showSuccess(
        'Milestone added',
        `Milestone "${clientMilestone.name}" added for ${new Date(clientMilestone.timestamp).toLocaleDateString()}.`
      );
      return { ok: true as const };
    };
    return execute(fn);
  };

  const deleteMilestone = async (milestoneName: string) => {
    execute(async () => {
      const result = await delete_(milestoneName);
      if (!result.ok) {
        showError('Error removing milestone', `${result.error}`);
        return;
      }
      store.removeMilestone(milestoneName);
      visibility.unhideMilestone(milestoneName);
    });
  };

  const updateMilestone = async (
    milestoneName: string,
    newMilestone: Partial<ClientMilestone>
  ) => {
    return execute(async () => {
      const result = await update(milestoneName, newMilestone);
      if (!result.ok) {
        showError('Error updating milestone', `${result.error}`);
        return {
          ok: false,
          error: result.error,
        };
      }

      store.updateMilestone(milestoneName, result.data);
      if (
        newMilestone.name &&
        milestoneName !== newMilestone.name &&
        visibility.isMilestoneHidden(milestoneName)
      ) {
        visibility.unhideMilestone(milestoneName);
        visibility.hideMilestone(newMilestone.name);
      }
      return {
        ok: true,
      };
    });
  };

  return {
    visibility,
    store,
    server,
    isSyncing,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  };
}
