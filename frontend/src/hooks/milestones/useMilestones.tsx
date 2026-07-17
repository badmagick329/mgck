'use client';

import useMilestoneStore from '@/hooks/milestones/useMilestoneStore';
import useMilestonesAutomaticSync from '@/hooks/milestones/useMilestonesAutomaticSync';
import useOperationToast from '@/hooks/milestones/useOperationToast';
import {
  ClientMilestone,
  clientMilestoneSchema,
  MilestoneAccount,
} from '@/lib/types/milestones';

export default function useMilestones(account: MilestoneAccount | null) {
  const store = useMilestoneStore(account);
  const { showError, showSuccess } = useOperationToast();

  const automaticSync = useMilestonesAutomaticSync({
    account,
    store,
  });

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
      const storedMilestone = store.addMilestone(parsed.data);
      automaticSync.requestSync();
      showSuccess(
        'Milestone added',
        `Milestone "${storedMilestone.name}" added for ${new Date(storedMilestone.timestamp).toLocaleDateString()}.`
      );
      return { ok: true as const };
    };
    return fn();
  };

  const deleteMilestone = async (publicId: string) => {
    const operation = async () => {
      const milestone = store.milestones.find(
        (current) => current.publicId === publicId
      );
      if (!milestone) {
        showError('Error removing milestone', 'Milestone not found');
        return { ok: false as const, error: 'Milestone not found' };
      }
      store.removeMilestone(publicId);
      automaticSync.requestSync();
      return { ok: true as const };
    };
    return operation();
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

    const operation = async () => {
      store.updateMilestone(publicId, merged.data);
      automaticSync.requestSync();
      return { ok: true as const };
    };
    return operation();
  };

  return {
    store,
    syncStatus: automaticSync.status,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  };
}
