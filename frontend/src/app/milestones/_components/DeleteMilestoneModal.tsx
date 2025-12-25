import useMilestones from '@/hooks/milestones/useMilestones';
import { Trash2Icon } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import useKeyboardOffset from '@/hooks/useKeyboardOffset';
import { useState } from 'react';

export default function DeleteMilestoneModal({
  milestoneName,
  deleteMilestone,
  isSyncing,
}: {
  milestoneName: string;
  deleteMilestone: ReturnType<typeof useMilestones>['db']['deleteMilestone'];
  isSyncing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { keyboardOffset } = useKeyboardOffset();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='h-8 w-8'>
          <Trash2Icon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className='sm:max-w-[425px]'
        style={{
          transform: `translate(-50%, calc(-50% - ${keyboardOffset}px))`,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            (async () => {
              deleteMilestone(milestoneName);
              setOpen(false);
            })();
          }}
        >
          <div className='grid gap-8'>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <p>
              Delete <span className='font-bold'>{milestoneName}</span>?
            </p>
            <DialogFooter>
              <div className='flex w-full justify-between gap-4'>
                <DialogClose asChild>
                  <Button variant='outline' disabled={isSyncing}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type='submit'
                  variant='destructive'
                  disabled={isSyncing}
                >
                  Delete
                </Button>
              </div>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
