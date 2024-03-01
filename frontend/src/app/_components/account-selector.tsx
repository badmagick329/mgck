import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { fetchAccounts } from "@/actions/actions";
import { Check, ChevronsUpDown } from "lucide-react";
import { SearchFormParams } from "@/lib/types";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AccountSelector({
  setFormParams,
  selectedAccount,
  setSelectedAccount,
}: {
  setFormParams: Dispatch<SetStateAction<SearchFormParams>>;
  selectedAccount: string;
  setSelectedAccount: Dispatch<SetStateAction<string>>;
}) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<string[]>([]);
  const FIELD_WIDTH = "w-[12rem]";

  useEffect(() => {
    const titleParam = (searchParams.get("title") || "") as string;
    const tagsParam = (searchParams.get("tags") || "") as string;
    setFormParams({
      title: titleParam,
      tags: tagsParam,
    });
    const updateAccounts = async () => {
      const resp = await fetchAccounts();
      const newAccounts = ["All", ...resp.accounts];
      setAccounts(newAccounts);
      const accountParam = (searchParams.get("account") || "").trim() as string;
      if (newAccounts.indexOf(accountParam) == -1) {
        setSelectedAccount("All");
      } else {
        setSelectedAccount(accountParam);
      }
    };
    updateAccounts();
  }, []);

  if (selectedAccount === "") {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`${FIELD_WIDTH} justify-between`}
        >
          {selectedAccount
            ? accounts.find((s) => s === selectedAccount)
            : "All"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`${FIELD_WIDTH} p-0`}>
        <Command>
          <CommandInput placeholder="Filter by account" />
          <CommandEmpty>No accounts found.</CommandEmpty>
          <CommandGroup>
            {accounts.map((s) => {
              return (
                <CommandItem
                  key={s}
                  defaultChecked={selectedAccount === s}
                  onSelect={(currentValue) => {
                    setSelectedAccount(
                      currentValue === selectedAccount ? "All" : s
                    );
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedAccount === s ? "opacity-100" : "opacity-0"
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
