import {
  createMilestoneAction,
  listMilestonesAction,
  removeMilestoneAction,
} from '@/actions/milestones';
import { ClientMilestone } from '@/lib/types/milestones';

export default function useMilestoneSync(
  isUsingServer: boolean,
  milestones: ClientMilestone[]
) {
  return {
    create: async (
      milestone: ClientMilestone
    ): ReturnType<typeof createMilestoneAction> =>
      isUsingServer
        ? await createMilestoneAction(milestone)
        : { ok: true, data: milestone },

    remove: async (name: string): ReturnType<typeof removeMilestoneAction> =>
      isUsingServer
        ? await removeMilestoneAction(name)
        : { ok: true, data: 'success' },

    list: async (): ReturnType<typeof listMilestonesAction> =>
      isUsingServer
        ? await listMilestonesAction()
        : { ok: true, data: milestones },
  };
}
