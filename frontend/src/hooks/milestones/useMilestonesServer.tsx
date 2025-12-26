import {
  createMilestoneAction,
  listMilestonesAction,
  deleteMilestoneAction,
} from '@/actions/milestones';
import useMilestoneStore from '@/hooks/milestones/useMilestoneStore';
import useOperationToast from '@/hooks/milestones/useOperationToast';
import useSyncOperation from '@/hooks/milestones/useSyncOperation';
import { ClientMilestone, clientMilestoneSchema } from '@/lib/types/milestones';

export default function useMilestonesServer({
  execute,
  milestones,
  setMilestones,
  setServerLinked,
}: {
  execute: ReturnType<typeof useSyncOperation>['execute'];
  milestones: ClientMilestone[];
  setMilestones: ReturnType<typeof useMilestoneStore>['setMilestones'];
  setServerLinked: ReturnType<typeof useMilestoneStore>['setServerLinked'];
}) {
  const { showError, withErrorToast } = useOperationToast();

  const applyChangesToServerAndLink = async () => {
    execute(async () => {
      const safeMilestones: ClientMilestone[] = [];
      for (const m of milestones) {
        const parsed = clientMilestoneSchema.safeParse(m);
        if (!parsed.success) {
          showError(
            'Invalid milestone in local storage',
            `Please fix or remove "${m.name}" before syncing.`
          );
          return;
        }
        safeMilestones.push(parsed.data);
      }

      const listResult = await withErrorToast(
        () => listMilestonesAction(),
        'Error syncing milestones'
      );
      if (!listResult.ok) {
        return;
      }

      const serverNames = new Set(listResult.data.map((m) => m.name));
      const clientNames = new Set(safeMilestones.map((m) => m.name));

      const toCreate = safeMilestones.filter((m) => !serverNames.has(m.name));
      const toDelete = listResult.data
        .filter((m) => !clientNames.has(m.name))
        .map((m) => m.name);

      if (toCreate.length === 0 && toDelete.length === 0) {
        setServerLinked(true);
        return;
      }

      const errors: string[] = [];

      for (const m of toCreate) {
        const result = await createMilestoneAction(m);
        if (!result.ok) {
          errors.push(`Create "${m.name}": ${result.error}`);
        }
      }

      for (const name of toDelete) {
        const result = await deleteMilestoneAction(name);
        if (!result.ok) {
          errors.push(`Delete "${name}": ${result.error}`);
        }
      }

      if (errors.length > 0) {
        console.error('Sync errors:', errors);
        showError(
          'Sync completed with errors',
          `${errors.length} operation(s) failed`
        );
      }

      const refreshResult = await listMilestonesAction();
      if (refreshResult.ok) {
        setMilestones(refreshResult.data);
        setServerLinked(true);
      } else {
        setServerLinked(false);
      }
    });
  };

  const retrieveChangesFromServerAndLink = async () => {
    execute(async () => {
      const result = await withErrorToast(
        () => listMilestonesAction(),
        'Error retrieving milestones from server'
      );
      if (!result.ok) {
        return;
      }

      setMilestones(result.data);
      setServerLinked(true);
    });
  };

  const unlinkFromServer = () => setServerLinked(false);

  return {
    applyChangesToServerAndLink,
    retrieveChangesFromServerAndLink,
    unlinkFromServer,
  };
}
