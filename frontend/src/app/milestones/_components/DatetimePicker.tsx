import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ChevronDownIcon } from 'lucide-react';

export default function DatetimePicker({
  date,
  setDate,
  disabled,
}: {
  date: Date | undefined;
  setDate: React.Dispatch<React.SetStateAction<undefined | Date>>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className='flex w-full flex-col items-center gap-3'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className='flex w-full justify-center'>
            <Button
              variant='outline'
              id='date'
              className='h-10 w-full justify-between font-normal'
              disabled={disabled}
              type='button'
            >
              {date ? date.toLocaleDateString() : 'Select date'}
              <ChevronDownIcon />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
          <Calendar
            mode='single'
            selected={date}
            captionLayout='label'
            onSelect={(date) => {
              setDate(date);
              setOpen(false);
            }}
            endMonth={new Date(2150, 0)}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
