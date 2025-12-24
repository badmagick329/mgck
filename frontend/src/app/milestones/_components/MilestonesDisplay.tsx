'use client';
import { Button } from '@/components/ui/button';
import {
  getDiffIn,
  getDiffInDays,
  getLocalDateDisplay,
  getLocalDatetimeDisplay,
} from '@/lib/milestones';
import { ClientMilestone, DiffPeriod } from '@/lib/types/milestones';
import { Trash2Icon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { capitaliseWords } from '@/lib/utils';


export default function MilestonesDisplay({
  milestones,
  isSyncing,
  removeMilestone,
  diffPeriod,
}: {
  milestones: ClientMilestone[];
  isSyncing: boolean;
  removeMilestone: (name: string) => void;
  diffPeriod: DiffPeriod;
}) {
  const params = useSearchParams();
  const debug = Boolean(params.get('debug'));

  return (
    <Table className='sm:text-sm'>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className='hidden md:table-cell'>
            {capitaliseWords(diffPeriod)} to Go
          </TableHead>
          <TableHead className='text-right'>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {milestones.map((m) => {
          const date = new Date(m.timestamp);
          return (
            <TableRow key={m.name}>
              <TableCell className='font-medium'>{m.name}</TableCell>
              <TableCell>
                {debug
                  ? getLocalDatetimeDisplay(date, m.timezone)
                  : getLocalDateDisplay(date, m.timezone)}
              </TableCell>
              <TableCell className='hidden md:block'>
                {getDiffIn(date, diffPeriod)}
              </TableCell>
              <TableCell className='text-right'>
                {
                  <Button
                    variant={'destructive'}
                    onClick={() => removeMilestone(m.name)}
                    disabled={isSyncing}
                    className='h-8 w-8 justify-self-end'
                  >
                    <Trash2Icon />
                  </Button>
                }
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
