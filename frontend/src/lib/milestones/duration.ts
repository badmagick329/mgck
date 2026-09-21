export const durationUnits = ['days', 'weeks', 'months'] as const;

export type DurationUnit = (typeof durationUnits)[number];

export const isDurationUnit = (value: string): value is DurationUnit =>
  (durationUnits as readonly string[]).includes(value);

/**
 * Resolves a relative duration into the absolute local-midnight timestamp that
 * milestones are stored against. Calendar arithmetic via setDate/setMonth is
 * deliberate rather than raw millisecond offsets: it keeps the result on the
 * intended calendar day across DST transitions, and month durations clamp to
 * the target month's last day so "31 Jan + 1 month" lands on 28/29 Feb instead
 * of silently rolling into March.
 */
export const resolveDurationDate = ({
  amount,
  unit,
  from,
}: {
  amount: number;
  unit: DurationUnit;
  from: Date;
}): Date => {
  const target = new Date(from);
  if (unit === 'months') {
    const day = target.getDate();
    target.setDate(1);
    target.setMonth(target.getMonth() + amount);
    const lastDayOfTargetMonth = new Date(
      target.getFullYear(),
      target.getMonth() + 1,
      0
    ).getDate();
    target.setDate(Math.min(day, lastDayOfTargetMonth));
  } else {
    target.setDate(target.getDate() + (unit === 'weeks' ? amount * 7 : amount));
  }
  target.setHours(0, 0, 0, 0);
  return target;
};
