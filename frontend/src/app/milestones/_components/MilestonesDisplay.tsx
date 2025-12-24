'use client';
import { Button } from '@/components/ui/button';
import {
  getDiffInDays,
  getLocalDateDisplay,
  getLocalDatetimeDisplay,
} from '@/lib/milestones';
import { ClientMilestone } from '@/lib/types/milestones';
import { Trash2Icon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React from 'react';

export default function MilestonesDisplay({
  milestones,
  isSyncing,
  removeMilestone,
}: {
  milestones: ClientMilestone[];
  isSyncing: boolean;
  removeMilestone: (name: string) => void;
}) {
  const params = useSearchParams();
  const debug = Boolean(params.get('debug'));

  return (
    <div className='grid grid-cols-4 gap-2 lg:col-span-3'>
      {milestones.length > 0 ? (
        milestones.map((m) => {
          const date = new Date(m.timestamp);

          return (
            <React.Fragment key={m.name}>
              <span>{m.name}</span>
              <span>
                {debug
                  ? getLocalDatetimeDisplay(date, m.timezone)
                  : getLocalDateDisplay(date, m.timezone)}
              </span>
              <span>({getDiffInDays(date)})</span>
              <Button
                variant={'destructive'}
                onClick={() => removeMilestone(m.name)}
                disabled={isSyncing}
                className='h-8 w-8 justify-self-end'
              >
                <Trash2Icon />
              </Button>
            </React.Fragment>
          );
        })
      ) : (
        <p>No milestones entered</p>
      )}
    </div>
  );
}
