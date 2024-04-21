import SearchForm from "./search-form";
import GfyList from "./gfy-list";
import SearchNavigation from "./search-navigation";

export default function Gfys() {
  return (
    <div className={"flex h-full w-full flex-col items-center px-10"}>
      <SearchForm />
      <GfyList />
      <SearchNavigation onClient={false} />
    </div>
  );
}
