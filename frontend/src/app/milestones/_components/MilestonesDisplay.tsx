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
import { capitaliseWords, formatNumberWithCommas } from '@/lib/utils';
import useFeatureFlag from '@/hooks/useFeatureFlag';
import useMilestones from '@/hooks/milestones/useMilestones';
import MilestoneActions from '@/app/milestones/_components/MilestoneActions';

type Props = {
  milestones: ClientMilestone[];
  isSyncing: boolean;
  deleteMilestone: ReturnType<typeof useMilestones>['deleteMilestone'];
  updateMilestone: ReturnType<typeof useMilestones>['updateMilestone'];
  diffPeriod: DiffPeriod;
  visibility: ReturnType<typeof useMilestones>['visibility'];
};

export default function MilestonesDisplay({
  milestones,
  isSyncing,
  deleteMilestone,
  updateMilestone,
  diffPeriod,
  visibility,
}: Props) {
  const { getBooleanFlag } = useFeatureFlag();
  const debug = getBooleanFlag('debug');
  if (milestones.length === 0) {
    return null;
  }

  return (
    <Table className='mx-auto max-w-4xl sm:text-sm'>
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
          const isHidden = visibility.isMilestoneHidden(m.name);
          return (
            <TableRow key={m.name}>
              <TableCell className='font-medium'>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                  <div
                    className='h-3 w-3'
                    style={{ backgroundColor: m.color }}
                  ></div>
                  <span>{m.name}</span>
                </div>
              </TableCell>
              <TableCell>
                {debug
                  ? getLocalDatetimeDisplay(date, m.timezone)
                  : getLocalDateDisplay(date, m.timezone)}
              </TableCell>
              <TableCell className='hidden md:table-cell'>
                {formatNumberWithCommas(getDiffIn(date, diffPeriod))}
              </TableCell>
              <TableCell className='text-right'>
                <MilestoneActions
                  isHidden={isHidden}
                  isSyncing={isSyncing}
                  deleteMilestone={deleteMilestone}
                  updateMilestone={updateMilestone}
                  visibility={visibility}
                  milestone={m}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
