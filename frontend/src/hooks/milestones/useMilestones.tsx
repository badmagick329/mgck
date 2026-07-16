'use client';

import useMilestoneStore from '@/hooks/milestones/useMilestoneStore';
import useMilestoneSyncAdaptor from '@/hooks/milestones/useMilestonesSync';
import useMilestonesServer from '@/hooks/milestones/useMilestonesServer';
import useOperationToast from '@/hooks/milestones/useOperationToast';
import useSyncOperation from '@/hooks/milestones/useSyncOperation';
import {
  ClientMilestone,
  clientMilestoneSchema,
  MilestoneAccount,
} from '@/lib/types/milestones';

export default function useMilestones(account: MilestoneAccount | null) {
  const store = useMilestoneStore(account);
  const { showError, showSuccess } = useOperationToast();
  const { isSyncing, execute } = useSyncOperation();

  const server = useMilestonesServer({
    execute,
    milestones: store.milestones,
    replaceActiveFromServer: store.replaceActiveFromServer,
    setServerLinked: store.setServerLinked,
  });

  const isUsingServer = Boolean(account && store.config.milestonesOnServer);
  const { create, delete_, update } = useMilestoneSyncAdaptor(
    isUsingServer,
    store.milestones
  );

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
    const normalizedName = name.trim();
    const exists = store.milestones.some(
      (milestone) => milestone.name === normalizedName
    );
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
      const parsed = clientMilestoneSchema.safeParse({
        name: normalizedName,
        timestamp: date.getTime(),
        timezone,
        color,
      });
      if (!parsed.success) {
        showError('Invalid milestone', parsed.error.errors[0].message);
        return {
          ok: false as const,
          error: parsed.error.errors[0].message,
        };
      }
      const result = await create(parsed.data);
      if (!result.ok) {
        showError('Error adding milestone', `${result.error}`);
        return { ok: false as const, error: `${result.error}` };
      }

      const storedMilestone = store.addMilestone(result.data);
      showSuccess(
        'Milestone added',
        `Milestone "${storedMilestone.name}" added for ${new Date(storedMilestone.timestamp).toLocaleDateString()}.`
      );
      return { ok: true as const };
    };
    return execute(fn);
  };

  const deleteMilestone = async (publicId: string) => {
    return execute(async () => {
      const milestone = store.milestones.find(
        (current) => current.publicId === publicId
      );
      if (!milestone) {
        showError('Error removing milestone', 'Milestone not found');
        return { ok: false as const, error: 'Milestone not found' };
      }
      const result = await delete_(milestone.name);
      if (!result.ok) {
        showError('Error removing milestone', `${result.error}`);
        return { ok: false as const, error: `${result.error}` };
      }
      store.removeMilestone(publicId);
      return { ok: true as const };
    });
  };

  const updateMilestone = async (
    publicId: string,
    newMilestone: Partial<ClientMilestone>
  ) => {
    const existing = store.milestones.find(
      (milestone) => milestone.publicId === publicId
    );
    if (!existing) {
      showError('Error updating milestone', 'Milestone not found');
      return { ok: false as const, error: 'Milestone not found' };
    }
    const merged = clientMilestoneSchema.safeParse({
      name: newMilestone.name ?? existing.name,
      timestamp: newMilestone.timestamp ?? existing.timestamp,
      timezone: newMilestone.timezone ?? existing.timezone,
      color: newMilestone.color ?? existing.color,
    });
    if (!merged.success) {
      showError('Invalid milestone', merged.error.errors[0].message);
      return { ok: false as const, error: merged.error.errors[0].message };
    }
    const duplicate = store.milestones.some(
      (milestone) =>
        milestone.publicId !== publicId && milestone.name === merged.data.name
    );
    if (duplicate) {
      showError(
        'Duplicate milestone',
        'A milestone with this name already exists.'
      );
      return {
        ok: false as const,
        error: 'A milestone with this name already exists.',
      };
    }

    return execute(async () => {
      const result = await update(existing.name, merged.data);
      if (!result.ok) {
        showError('Error updating milestone', `${result.error}`);
        return { ok: false as const, error: `${result.error}` };
      }
      store.updateMilestone(publicId, result.data);
      return { ok: true as const };
    });
  };

  return {
    store,
    server,
    isSyncing,
    isUsingServer,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  };
}
