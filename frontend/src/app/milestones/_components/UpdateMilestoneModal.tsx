import useMilestones from '@/hooks/milestones/useMilestones';
import useDebounceInput from '@/hooks/useDebounceInput';
import useKeyboardOffset from '@/hooks/useKeyboardOffset';
import { ClientMilestone, clientMilestoneSchema } from '@/lib/types/milestones';
import { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SquarePenIcon } from 'lucide-react';
import DatetimePicker from '@/app/milestones/_components/DatetimePicker';
import { MilestonesButton } from '@/components/ui/MilestonesButton';
import ColorPicker from '@/app/milestones/_components/ColorPicker';
import { useToast } from '@/components/ui/use-toast';

export default function UpdateModal({
  existingMilestone,
  isSyncing,
  updateMilestone,
}: {
  existingMilestone: ClientMilestone;
  isSyncing: boolean;
  updateMilestone: ReturnType<typeof useMilestones>['db']['updateMilestone'];
}) {
  const { keyboardOffset } = useKeyboardOffset();
  const [date, setDate] = useState<Date | undefined>(
    new Date(existingMilestone.timestamp)
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(existingMilestone.name);
  const {
    value: color,
    setValue: setColor,
    handleChange: handleColorChange,
  } = useDebounceInput({
    defaultValue: existingMilestone.color,
    delay: 100,
  });
  const { toast } = useToast();
  const setDialog = (isOpen: boolean) => {
    if (isOpen) {
      setName(existingMilestone.name);
      setDate(new Date(existingMilestone.timestamp));
      setColor(existingMilestone.color);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={setDialog}>
      <DialogTrigger asChild>
        <Button variant='outline' className='h-8 w-8'>
          <SquarePenIcon />
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
              const newMilestone = {
                name,
                timestamp: date ? date.getTime() : undefined,
                timezone: existingMilestone.timezone,
                color,
              };
              const parsed = clientMilestoneSchema.safeParse(newMilestone);
              if (parsed.error) {
                return toast({
                  title: 'Invalid Milestone',
                  description: parsed.error.errors[0].message,
                  variant: 'destructive',
                });
              }
              const result = await updateMilestone(
                existingMilestone.name,
                parsed.data
              );
              if (!result.ok) {
                return toast({
                  title: 'Error updating milestone',
                  description: result.error,
                  variant: 'destructive',
                });
              }
              setOpen(false);
            })();
          }}
        >
          <div className='grid gap-8'>
            <DialogHeader>
              <DialogTitle>Update Milestone</DialogTitle>
            </DialogHeader>
            <div className='grid gap-4'>
              <Input
                type='text'
                onChange={(e) => setName(e.target.value || '')}
                value={name}
                disabled={isSyncing}
                placeholder='Enter milestone name... e.g Birthday'
                className='focus-visible:ring-0 focus-visible:ring-offset-0'
              />
              <DatetimePicker
                date={date}
                setDate={setDate}
                disabled={isSyncing}
              />
              <div className='ml-auto'>
                <ColorPicker
                  color={color}
                  handleColorChange={handleColorChange}
                  disabled={isSyncing}
                />
              </div>
            </div>
            <DialogFooter>
              <div className='flex w-full justify-between gap-4'>
                <DialogClose asChild>
                  <Button
                    variant='outline'
                    disabled={isSyncing}
                    className='max-w-[100px]'
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <MilestonesButton
                  type='submit'
                  appVariant='milestonesPrimary'
                  disabled={isSyncing}
                  className='max-w-[100px]'
                >
                  Update
                </MilestonesButton>
              </div>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
