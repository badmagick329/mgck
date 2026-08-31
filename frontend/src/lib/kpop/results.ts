import { ComebackResponse } from '@/lib/types/kpop';

export type ComebackDateGroup = {
  date: string;
  comebacks: ComebackResponse[];
};

export function groupComebacksByDate(
  comebacks: ComebackResponse[]
): ComebackDateGroup[] {
  const groups = new Map<string, ComebackResponse[]>();

  for (const comeback of comebacks) {
    const dateGroup = groups.get(comeback.date);
    if (dateGroup) {
      dateGroup.push(comeback);
      continue;
    }
    groups.set(comeback.date, [comeback]);
  }

  return Array.from(groups, ([date, groupedComebacks]) => ({
    date,
    comebacks: groupedComebacks,
  }));
}
