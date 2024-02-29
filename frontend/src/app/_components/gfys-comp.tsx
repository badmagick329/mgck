import { Suspense } from "react";
import SearchForm from "./search-form";
import GfyList from "./gfy-list";
import Loading from "@/app/loading";
import SearchNav from "./search-nav";

export default function Gfys() {
  return (
    <div className={"flex h-full w-full flex-col items-center px-10"}>
      <Suspense fallback={<Loading />}>
        <SearchForm />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <GfyList />
      </Suspense>
      <Suspense fallback={<Loading />}>
        <SearchNav attachListeners={false} />
      </Suspense>
    </div>
  );
}
