'use client';
import { Button } from '@/components/ui/button';
import {
  getDiffIn,
  getLocalDateDisplay,
  getLocalDatetimeDisplay,
} from '@/lib/milestones';
import { ClientMilestone, DiffPeriod } from '@/lib/types/milestones';
import { Trash2Icon } from 'lucide-react';
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
import useFeatureFlag from '@/hooks/useFeatureFlag';
import useMilestones from '@/hooks/milestones/useMilestones';
import UpdateModal from '@/app/milestones/_components/UpdateMilestoneModal';

export default function MilestonesDisplay({
  milestones,
  isSyncing,
  deleteMilestone,
  updateMilestone,
  diffPeriod,
}: {
  milestones: ClientMilestone[];
  isSyncing: boolean;
  deleteMilestone: ReturnType<typeof useMilestones>['db']['deleteMilestone'];
  updateMilestone: ReturnType<typeof useMilestones>['db']['updateMilestone'];
  diffPeriod: DiffPeriod;
}) {
  const { getBooleanFlag } = useFeatureFlag();
  const debug = getBooleanFlag('debug');

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
                <div className='flex justify-end gap-2'>
                  <UpdateModal
                    existingMilestone={m}
                    isSyncing={isSyncing}
                    updateMilestone={updateMilestone}
                  />
                  <Button
                    variant={'destructive'}
                    onClick={() => deleteMilestone(m.name)}
                    disabled={isSyncing}
                    className='h-8 w-8'
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
