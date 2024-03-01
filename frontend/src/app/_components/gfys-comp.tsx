import SearchForm from "./search-form";
import GfyList from "./gfy-list";
import SearchNav from "./search-nav";

export default function Gfys() {
  return (
    <div className={"flex h-full w-full flex-col items-center px-10"}>
      <SearchForm />
      <GfyList />
      <SearchNav onClient={false} />
    </div>
  );
}
