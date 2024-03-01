import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction, useState } from "react";
import { createURL } from "@/lib/utils";
import AccountSelector from "./account-selector";
import { SearchFormParams, SearchParams } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import SearchTextInput from "./search-text-input";

export default function SearchFormContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [formParams, setFormParams] = useState<SearchFormParams>({
    title: "",
    tags: "",
  });
  const [selectedAccount, setSelectedAccount] = useState("");
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        const newURL = getNewURL(
          e,
          formParams,
          searchParams,
          selectedAccount,
          pathname,
          setFormParams
        );
        router.push(newURL);
      }}
      className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4"
    >
      <SearchTextInput
        name={"title"}
        searchParams={searchParams}
        formParams={formParams}
        setFormParams={setFormParams}
      />
      <SearchTextInput
        name={"tags"}
        searchParams={searchParams}
        formParams={formParams}
        setFormParams={setFormParams}
      />
      <AccountSelector
        setFormParams={setFormParams}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
      />
      <div className="flex justify-center gap-2 md:justify-end lg:justify-center">
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </div>
    </form>
  );
}

function getNewURL(
  e: React.FormEvent<HTMLFormElement>,
  formParams: SearchFormParams,
  searchParams: SearchParams,
  selectedAccount: string,
  pathname: string,
  setFormParams: Dispatch<SetStateAction<SearchFormParams>>
) {
  e.preventDefault();
  setFormParams({
    title: formParams.title.trim(),
    tags: formParams.tags.trim(),
  });
  const newParams = createURLparams(
    formParams,
    searchParams,
    selectedAccount,
    true
  );
  const newURL = createURL(pathname, newParams.toString());
  return newURL;
}

function createURLparams(
  formParams: SearchFormParams,
  searchParams: SearchParams,
  selectedAccount: string,
  clearPage: boolean = false
) {
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
