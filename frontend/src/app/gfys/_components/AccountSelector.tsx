import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SearchParams } from '@/lib/types/gfys';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export default function AccountSelector({
  accounts,
  selectedAccount,
  setSelectedAccount,
}: {
  accounts: string[];
  searchParams: SearchParams;
  selectedAccount: string;
  setSelectedAccount: Dispatch<SetStateAction<string>>;
}) {
  const [open, setOpen] = useState(false);
  const FIELD_WIDTH = 'w-[12rem]';
  const searchParams = useSearchParams();

  useEffect(() => {
    updateAccounts(searchParams, accounts, setSelectedAccount);
  }, [searchParams]);

  if (selectedAccount === '') {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={`${FIELD_WIDTH} justify-between border-2 border-black/60 bg-background-gf-dark/15 hover:bg-background-gf-dark/15 dark:border-white/60 dark:bg-background-gf-dark`}
        >
          {selectedAccount
            ? accounts.find((s) => s === selectedAccount)
            : 'All'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`${FIELD_WIDTH} p-0`}>
        <Command>
          <CommandInput placeholder='Filter by account' />
          <CommandEmpty>No accounts found.</CommandEmpty>
          <CommandGroup>
            {accounts.map((s) => {
              return (
                <CommandItem
                  key={s}
                  defaultChecked={selectedAccount === s}
                  onSelect={(currentValue) => {
                    setSelectedAccount(
                      currentValue === selectedAccount ? 'All' : s
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedAccount === s ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {s}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

async function updateAccounts(
  searchParams: SearchParams,
  accounts: string[],
  setSelectedAccount: Dispatch<SetStateAction<string>>
) {
  const accountParam = (searchParams.get('account') || '').trim() as string;
  if (accounts.indexOf(accountParam) == -1) {
    setSelectedAccount('All');
  } else {
    setSelectedAccount(accountParam);
  }
}
