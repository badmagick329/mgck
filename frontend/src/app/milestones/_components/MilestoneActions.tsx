'use client';
import { ClientMilestone } from '@/lib/types/milestones';
import React from 'react';
import useMilestones from '@/hooks/milestones/useMilestones';
import UpdateModal from '@/app/milestones/_components/UpdateMilestoneModal';
import DeleteMilestoneModal from '@/app/milestones/_components/DeleteMilestoneModal';
import { Button } from '@/components/ui/button';
import { EllipsisVerticalIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function MilestoneActions({
  isHidden,
  isSyncing,
  deleteMilestone,
  updateMilestone,
  store,
  milestone,
}: {
  milestone: ClientMilestone;
  isHidden: boolean;
  isSyncing: boolean;
  deleteMilestone: ReturnType<typeof useMilestones>['deleteMilestone'];
  updateMilestone: ReturnType<typeof useMilestones>['updateMilestone'];
  store: ReturnType<typeof useMilestones>['store'];
}) {
  return (
    <>
      <div className='sm:hidden'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='h-8 w-8'>
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='flex flex-col'>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={(e) =>
                isHidden
                  ? store.unhideMilestone(milestone.name)
                  : store.hideMilestone(milestone.name)
              }
              className='py-2'
            >
              <span className='mx-auto'>{isHidden ? 'Show' : 'Hide'}</span>
            </DropdownMenuItem>
            <UpdateModal
              existingMilestone={milestone}
              isSyncing={isSyncing}
              updateMilestone={updateMilestone}
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className='py-2'
                >
                  <span className='mx-auto'>Edit</span>
                </DropdownMenuItem>
              }
            />
            <DeleteMilestoneModal
              milestoneName={milestone.name}
              isSyncing={isSyncing}
              deleteMilestone={deleteMilestone}
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className='py-2'
                >
                  <span className='mx-auto'>Delete</span>
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='hidden justify-end gap-2 sm:flex'>
        <Button
          className='h-8 w-8'
          variant='outline'
          type='button'
          onClick={(e) =>
            isHidden
              ? store.unhideMilestone(milestone.name)
              : store.hideMilestone(milestone.name)
          }
        >
          {isHidden ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
        <UpdateModal
          existingMilestone={milestone}
          isSyncing={isSyncing}
          updateMilestone={updateMilestone}
        />
        <DeleteMilestoneModal
          milestoneName={milestone.name}
          isSyncing={isSyncing}
          deleteMilestone={deleteMilestone}
        />
      </div>
    </>
  );
}
