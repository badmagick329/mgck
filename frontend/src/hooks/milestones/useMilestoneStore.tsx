import useLocalStorage from '@/hooks/useLocalStorage';
import {
  ClientMilestone,
  MilestonesConfig,
  DiffPeriod,
} from '@/lib/types/milestones';

export default function useMilestoneStore() {
  const {
    value: milestones,
    updateValue: setMilestones,
    isLoaded: milestonesLoaded,
  } = useLocalStorage<ClientMilestone[]>('milestones', []);

  const {
    value: config,
    updateValue: setConfig,
    isLoaded: configLoaded,
  } = useLocalStorage<MilestonesConfig>('milestonesConfig', {
    milestonesOnServer: false,
    diffPeriod: 'days',
  });

  const setDiffPeriod = (period: DiffPeriod) => {
    setConfig((prev) => ({ ...prev, diffPeriod: period }));
  };

  const setServerLinked = (linked: boolean) => {
    setConfig((prev) => ({ ...prev, milestonesOnServer: linked }));
  };

  const addMilestone = (milestone: ClientMilestone) => {
    setMilestones((prev) =>
      [...prev, milestone].sort((a, b) => a.timestamp - b.timestamp)
    );
  };

  const removeMilestone = (name: string) => {
    setMilestones((prev) => prev.filter((m) => m.name !== name));
  };

  const updateMilestone = (name: string, updates: Partial<ClientMilestone>) => {
    setMilestones((prev) =>
      prev.map((m) => (m.name === name ? { ...m, ...updates } : m))
    );
  };

  return {
    milestones,
    config,
    isLoaded: milestonesLoaded && configLoaded,
    addMilestone,
    removeMilestone,
    updateMilestone,
    setDiffPeriod,
    setServerLinked,
    setMilestones,
  };
}
