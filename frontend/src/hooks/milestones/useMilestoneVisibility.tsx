import useLocalStorage from '@/hooks/useLocalStorage';
import { ClientMilestone } from '@/lib/types/milestones';

export default function useMilestoneVisibility() {
  const { value: hiddenMilestones, updateValue: setHiddenMilestones } =
    useLocalStorage<string[]>('hiddenMilestones', []);

  const hideMilestone = (name: string) => {
    if (hiddenMilestones.length === 0) {
      setHiddenMilestones([name]);
      return;
    }

    if (hiddenMilestones.includes(name)) {
      return;
    }
    setHiddenMilestones([...hiddenMilestones, name]);
  };

  const unhideMilestone = (name: string) => {
    const hidden = Array.isArray(hiddenMilestones) ? hiddenMilestones : [];
    if (!hidden.includes(name)) return;
    setHiddenMilestones(hidden.filter((m) => m !== name));
  };

  const visibleMilestones = (milestones: ClientMilestone[]) => {
    const hidden = Array.isArray(hiddenMilestones) ? hiddenMilestones : [];
    if (hidden.length === 0) return milestones;
    return milestones.filter((m) => !hidden.includes(m.name));
  };

  const isMilestoneHidden = (name: string) => {
    const hidden = Array.isArray(hiddenMilestones) ? hiddenMilestones : [];
    if (hidden.length === 0) return false;
    return hidden.includes(name);
  };

  return {
    hiddenMilestones,
    hideMilestone,
    unhideMilestone,
    isMilestoneHidden,
  };
}
