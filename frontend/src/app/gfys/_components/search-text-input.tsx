import { Dispatch, SetStateAction, useEffect } from "react";
import { SearchFormParams, SearchParams } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SearchTextInput({
  name,
  searchParams,
  formParams,
  setFormParams,
  placeholder,
  tooltip,
}: {
  name: "title" | "tags" | "start_date" | "end_date";
  searchParams: SearchParams;
  formParams: SearchFormParams;
  setFormParams: Dispatch<SetStateAction<SearchFormParams>>;
  tooltip: string;
  placeholder: string;
}) {
  useEffect(() => {
    setFormParams({
      ...formParams,
      [name]: searchParams.get(name) || "",
    });
  }, [searchParams]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <input
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[12rem]"
            name={name}
            placeholder={placeholder}
            autoComplete="off"
            type="search"
            value={formParams[name]}
            onChange={(e) =>
              setFormParams({ ...formParams, [name]: e.target.value })
            }
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TooltipDemo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
