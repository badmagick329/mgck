// import Player from "@/components/VideoPlayer";
import { ThemeToggler } from "@/components/ThemeToggler";
import Gfys from "@/components/gfys/Gfys";
import { Suspense } from "react";
import Loading from "@/app/loading";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6">
      <div className="flex w-screen justify-end mr-8">
        <div className="px-4">
          <ThemeToggler />
        </div>
      </div>
      <div className="py-4"></div>
      <div className="w-full h-full">
        <Suspense fallback={<Loading />}>
          <Gfys />
        </Suspense>
      </div>
    </main>
  );
}
