// import Player from "@/components/VideoPlayer";
import { ThemeToggler } from "@/components/ThemeToggler";
import SearchForm from "@/components/search-form/SearchForm";
import Gfys from "@/components/gfys/Gfys";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6">
      <div className="flex w-screen justify-end">
        <div className="px-4">
          <ThemeToggler />
        </div>
      </div>
      <SearchForm />
      <div className="py-4"></div>
      <Gfys />
    </main>
  );
}
