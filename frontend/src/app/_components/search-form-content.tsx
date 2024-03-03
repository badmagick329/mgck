import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { createURL } from "@/lib/utils";
import { fetchAccounts } from "@/actions/actions";
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
  const [accounts, setAccounts] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const titleParam = searchParams.get("title") || "";
    const tagsParam = searchParams.get("tags") || "";
    setFormParams({
      title: titleParam,
      tags: tagsParam,
    });
    initializeAccounts(searchParams, setAccounts, setSelectedAccount);
  }, []);

  function clearForm() {
    setFormParams({ title: "", tags: "" });
    setSelectedAccount("All");
    router.push(pathname);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const newURL = getNewURL(
      e,
      formParams,
      searchParams,
      selectedAccount,
      pathname,
      setFormParams
    );
    router.push(newURL);
  }

  return (
    <form
      onSubmit={handleSubmit}
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
        accounts={accounts}
        searchParams={searchParams}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
      />
      <div className="flex justify-center gap-2 md:justify-end lg:justify-center">
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <Button variant="secondary" onClick={clearForm}>
          Clear
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

async function initializeAccounts(
  searchParams: SearchParams,
  setAccounts: Dispatch<SetStateAction<string[]>>,
  setSelectedAccount: Dispatch<SetStateAction<string>>
) {
  const resp = await fetchAccounts();
  const newAccounts = ["All", ...resp.accounts];
  setAccounts(newAccounts);
  const accountParam = (searchParams.get("account") || "").trim() as string;
  if (newAccounts.indexOf(accountParam) == -1) {
    setSelectedAccount("All");
  } else {
    setSelectedAccount(accountParam);
  }
}
