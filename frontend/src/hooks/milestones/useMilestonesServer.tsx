import {
  createMilestoneAction,
  listMilestonesAction,
  removeMilestoneAction,
} from '@/actions/milestones';
import { useToast } from '@/components/ui/use-toast';
import useSyncOperation from '@/hooks/milestones/useSyncOperation';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ApiErrorResponse } from '@/lib/types';
import { ClientMilestone, clientMilestoneSchema } from '@/lib/types/milestones';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function useMilestonesServer({
  execute,
  milestones,
  setMilestones,
  toast,
  toastDuration,
  isUserLoggedIn,
}: {
  execute: ReturnType<typeof useSyncOperation>['execute'];
  milestones: ClientMilestone[];
  setMilestones: React.Dispatch<React.SetStateAction<ClientMilestone[]>>;
  toast: ReturnType<typeof useToast>['toast'];
  toastDuration: number;
  isUserLoggedIn: boolean;
}) {
  const {
    value: isUsingServer,
    updateValue: setIsUsingServer,
    isLoaded,
  } = useLocalStorage('milestonesOnServer', false);
  const router = useRouter();

  useEffect(() => {
    if (!isUsingServer) {
      return;
    }

    if (isUserLoggedIn) {
      // TODO: add unlink option
      router.push('/account');
      return;
    }

    execute(async () => {
      const result = await listMilestonesAction();
      // TODO: add retry / unlink option
      result.ok ? setMilestones(result.data) : setIsUsingServer(false);
    });
  }, []);

  const applyChangesToServerAndLink = async () => {
    execute(async () => {
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

      const serverMilestoneNames = result.data.map((m) => m.name);
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
        setIsUsingServer(true);
      }
      // TODO: add retry / unlink option
      setIsUsingServer(false);
    });
  };

  const retrieveChangesFromServerAndLink = async () => {
    execute(async () => {
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
    });
  };

  const unlinkFromServer = () => {
    setIsUsingServer(false);
  };

  return {
    isUsingServer,
    setIsUsingServer,
    isServerMilestonesLoaded: isLoaded,
    applyChangesToServerAndLink,
    retrieveChangesFromServerAndLink,
    unlinkFromServer,
  };
}
