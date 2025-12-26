'use client';
import {
  getDiffIn,
  getLocalDateDisplay,
  getLocalDatetimeDisplay,
} from '@/lib/milestones';
import { ClientMilestone, DiffPeriod } from '@/lib/types/milestones';
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
import DeleteMilestoneModal from '@/app/milestones/_components/DeleteMilestoneModal';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

type Props = {
  milestones: ClientMilestone[];
  isSyncing: boolean;
  deleteMilestone: ReturnType<typeof useMilestones>['db']['deleteMilestone'];
  updateMilestone: ReturnType<typeof useMilestones>['db']['updateMilestone'];
  diffPeriod: DiffPeriod;
  hideMilestone: ReturnType<typeof useMilestones>['state']['hideMilestone'];
  unhideMilestone: ReturnType<typeof useMilestones>['state']['unhideMilestone'];
  isMilestoneHidden: ReturnType<
    typeof useMilestones
  >['state']['isMilestoneHidden'];
};

export default function MilestonesDisplay({
  milestones,
  isSyncing,
  deleteMilestone,
  updateMilestone,
  diffPeriod,
  hideMilestone,
  unhideMilestone,
  isMilestoneHidden,
}: Props) {
  const { getBooleanFlag } = useFeatureFlag();
  const debug = getBooleanFlag('debug');
  if (milestones.length === 0) {
    return null;
  }

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
          const isHidden = isMilestoneHidden(m.name);
          console.log('ishidden', isHidden);
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
                  <Button
                    className='h-8 w-8'
                    variant='outline'
                    type='button'
                    onClick={(e) =>
                      isHidden ? unhideMilestone(m.name) : hideMilestone(m.name)
                    }
                  >
                    {isHidden ? <EyeOffIcon /> : <EyeIcon />}
                  </Button>
                  <UpdateModal
                    existingMilestone={m}
                    isSyncing={isSyncing}
                    updateMilestone={updateMilestone}
                  />
                  <DeleteMilestoneModal
                    milestoneName={m.name}
                    isSyncing={isSyncing}
                    deleteMilestone={deleteMilestone}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
