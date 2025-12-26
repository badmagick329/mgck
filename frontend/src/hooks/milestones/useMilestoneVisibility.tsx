import useLocalStorage from '@/hooks/useLocalStorage';
import { useMemo } from 'react';

export default function useMilestoneVisibility() {
  const { value: hiddenMilestones, updateValue: setHiddenMilestones } =
    useLocalStorage<string[]>('hiddenMilestones', []);

  const hiddenSet = useMemo(
    () => new Set(hiddenMilestones),
    [hiddenMilestones]
  );

  const hideMilestone = (name: string) => {
    if (hiddenSet.has(name)) {
      return;
    }
    setHiddenMilestones((prev) => [...prev, name]);
  };

  const unhideMilestone = (name: string) => {
    if (!hiddenSet.has(name)) {
      return;
    }
    setHiddenMilestones((prev) => prev.filter((n) => n !== name));
  };

  const isMilestoneHidden = (name: string) => hiddenSet.has(name);

  return {
    hiddenMilestones,
    hideMilestone,
    unhideMilestone,
    isMilestoneHidden,
  };
}
