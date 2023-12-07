import { Suspense } from "react";
import SearchForm from "@/components/gfys/search-form/SearchForm";
import GfyList from "@/components/gfys/GfyList";

// export const dynamic = "force-dynamic";

export default function Gfys() {
  return (
    <div className={"flex flex-col px-10 w-full h-full items-center"}>
      <SearchForm />
      <Suspense fallback="Loading...">
        <GfyList />
      </Suspense>
    </div>
  );
}
