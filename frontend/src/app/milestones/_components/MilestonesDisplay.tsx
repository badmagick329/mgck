'use client';
import { Button } from '@/components/ui/button';
import { getDiffInDays, getLocalDatetimeDisplay } from '@/lib/milestones';
import { ClientMilestone } from '@/lib/types/milestones';

export default function MilestonesDisplay({
  milestones,
  isSyncing,
  removeMilestone,
}: {
  milestones: ClientMilestone[];
  isSyncing: boolean;
  removeMilestone: (name: string) => void;
}) {
  return (
    <>
      {milestones.length > 0 ? (
        milestones.map((m) => {
          const date = new Date(m.timestamp);
          return (
            <div key={m.name} className='flex justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <span>{m.name}</span>
                <span>{getLocalDatetimeDisplay(date, m.timezone)}</span>
                <span>({getDiffInDays(date)})</span>
              </div>
              <Button
                variant={'destructive'}
                onClick={() => removeMilestone(m.name)}
                disabled={isSyncing}
              >
                Remove
              </Button>
            </div>
          );
        })
      ) : (
        <p>No milestones entered</p>
      )}
    </>
  );
}
