import { Dispatch, SetStateAction } from "react";
import { SearchFormParams, SearchParams } from "@/lib/types";

export default function SearchTextInput({
  name,
  searchParams,
  formParams,
  setFormParams,
}: {
  name: string;
  searchParams: SearchParams;
  formParams: SearchFormParams;
  setFormParams: Dispatch<SetStateAction<SearchFormParams>>;
}) {
  return (
    <input
      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[12rem]"
      name={name}
      placeholder={name.slice(0, 1).toUpperCase() + name.slice(1)}
      autoComplete="off"
      type="text"
      defaultValue={searchParams?.get(name) || ""}
      onChange={(e) => setFormParams({ ...formParams, [name]: e.target.value })}
    />
  );
}
