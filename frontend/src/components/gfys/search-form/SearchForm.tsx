"use client";
import { useGlobalContext } from "@/app/context/store";
import { Button } from "@/components/ui/button";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createURL } from "@/lib/utils";
import { fetchAccounts } from "@/actions/actions";
import { Check, ChevronsUpDown } from "lucide-react";
import SearchNav from "@/components/gfys/search-form/SearchNav";

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

type FormParams = {
  title: string;
  tags: string;
};

export default function SearchForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [formParams, setFormParams] = useState<FormParams>({
    title: "",
    tags: "",
  });
  const [accounts, setAccounts] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
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

  function createURLparams(clearPage = false) {
    const urlSearchParams = new URLSearchParams(searchParams.toString());
    if (formParams.title) {
      urlSearchParams.set("title", formParams.title);
    } else {
      urlSearchParams.delete("title");
    }
    if (formParams.tags) {
      urlSearchParams.set("tags", formParams.tags);
    } else {
      urlSearchParams.delete("tags");
    }
    if (selectedAccount && selectedAccount !== "All") {
      urlSearchParams.set("account", selectedAccount);
    } else {
      urlSearchParams.delete("account");
    }
    if (clearPage) {
      urlSearchParams.delete("page");
    }
    return urlSearchParams;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormParams({
      title: formParams.title.trim(),
      tags: formParams.tags.trim(),
    });
    const newParams = createURLparams(true);
    const newURL = createURL(pathname, newParams.toString());
    router.push(newURL);
  }

  function renderComboBox() {
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
                    value={s}
                    defaultChecked={selectedAccount === s}
                    onSelect={(currentValue) => {
                      // console.log(`currentValue: ${currentValue}`);
                      setSelectedAccount(s === "All" ? "All" : s);
                      setOpen(false);
                      // console.log(`selectedAccount: ${selectedAccount}`);
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

  function renderForm() {
    return (
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
      >
        <input
          className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${FIELD_WIDTH}`}
          name="title"
          placeholder="Title"
          autoComplete="off"
          type="text"
          defaultValue={searchParams?.get("title") || ""}
          onChange={(e) =>
            setFormParams({ ...formParams, title: e.target.value })
          }
        />
        <input
          className={`flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${FIELD_WIDTH}`}
          name="tags"
          placeholder="Tags"
          autoComplete="off"
          type="text"
          defaultValue={searchParams?.get("tags") || ""}
          onChange={(e) =>
            setFormParams({ ...formParams, tags: e.target.value })
          }
        />
        {selectedAccount === "" ? null : renderComboBox()}
        <div className="flex justify-center gap-2 md:justify-end">
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {renderForm()}
      <SearchNav attachListeners={true} />
    </div>
  );
}
