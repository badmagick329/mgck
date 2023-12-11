import { Suspense } from "react";
import SearchForm from "@/components/gfys/search-form/SearchForm";
import GfyList from "@/components/gfys/GfyList";
import Loading from "@/app/loading";

export default function Gfys() {
  return (
    <div className={"flex flex-col px-10 w-full h-full items-center"}>
      <Suspense fallback={<Loading />}>
        <SearchForm />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <GfyList />
      </Suspense>
    </div>
  );
}
