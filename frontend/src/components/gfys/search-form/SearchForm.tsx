"use client";
import { Button } from "@/components/ui/button"
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    const titleParam = (searchParams.get("title") || "") as string;
    const tagsParam = (searchParams.get("tags") || "") as string;
    setTitle(titleParam);
    setTags(tagsParam);
  }, []);

  function createURLparams(data: { titleText: string; tagsText: string }) {
    const { titleText: title, tagsText: tags } = data;
    const params = new URLSearchParams(searchParams.toString());
    setTitle((title) => title.trim());
    setTags((tags) => tags.trim());
    if (title) {
      params.set("title", title);
    } else {
      params.delete("title");
    }
    if (tags) {
      params.set("tags", tags);
    } else {
      params.delete("tags");
    }
    return params;
  }

  function createURL(path: string, paramsString: string) {
    if (paramsString) {
      return `${path}?${paramsString}`;
    }
    return path;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const val = e.target as HTMLFormElement;
    const titleText = (val.title as unknown as HTMLInputElement)?.value;
    const tagsText = (val.tags as HTMLInputElement)?.value;
    const newParams = createURLparams({
      titleText,
      tagsText,
    });
    const newURL = createURL(pathname, newParams.toString());
    router.push(newURL);
  }

  return (
    <form onSubmit={handleSubmit} className={"flex space-x-2"}>
      <input
        className={
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        }
        name="title"
        placeholder="Title"
        autoComplete="off"
        type="text"
        defaultValue={searchParams?.get("title") || ""}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className={
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        }
        name="tags"
        placeholder="Tags"
        autoComplete="off"
        type="text"
        defaultValue={searchParams?.get("tags") || ""}
        onChange={(e) => setTags(e.target.value)}
      />
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
