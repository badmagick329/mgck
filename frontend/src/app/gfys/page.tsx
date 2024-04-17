import { ThemeToggler } from "@/components/theme-toggler";
import Gfys from "./_components/gfys-comp";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6">
      <div className="mr-8 flex w-screen justify-end">
        <div className="px-4">
          <ThemeToggler />
        </div>
      </div>
      <div className="py-4"></div>
      <div className="h-full w-full">
        <Gfys />
      </div>
    </main>
  );
}
