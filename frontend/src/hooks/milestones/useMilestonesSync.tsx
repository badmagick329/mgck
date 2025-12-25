import {
  createMilestoneAction,
  listMilestonesAction,
  deleteMilestoneAction,
  updateMilestoneAction,
} from '@/actions/milestones';
import { ClientMilestone } from '@/lib/types/milestones';

export default function useMilestoneSyncAdaptor(
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

    delete_: async (name: string): ReturnType<typeof deleteMilestoneAction> =>
      isUsingServer
        ? await deleteMilestoneAction(name)
        : { ok: true, data: 'success' },

    list: async (): ReturnType<typeof listMilestonesAction> =>
      isUsingServer
        ? await listMilestonesAction()
        : { ok: true, data: milestones },
    update: async (
      milestoneName: string,
      newMilestone: Partial<ClientMilestone>
    ): ReturnType<typeof updateMilestoneAction> => {
      if (isUsingServer) {
        return await updateMilestoneAction(milestoneName, newMilestone);
      }
      const foundMilestone = milestones.find((m) => m.name === milestoneName);
      if (!foundMilestone) {
        return { ok: false, error: 'Milestone not found' };
      }
      if (newMilestone.name) {
        foundMilestone.name = newMilestone.name;
      }
      if (newMilestone.timestamp) {
        foundMilestone.timestamp = newMilestone.timestamp;
      }
      if (newMilestone.timezone) {
        foundMilestone.timezone = newMilestone.timezone;
      }
      if (newMilestone.color) {
        foundMilestone.color = newMilestone.color;
      }
      return { ok: true, data: foundMilestone };
    },
  };
}
