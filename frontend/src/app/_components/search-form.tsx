"use client";
import SearchNavigation from "./search-navigation";
import SearchFormContent from "./search-form-content";

export default function SearchForm() {
  return (
    <div className="flex flex-col items-center">
      <SearchFormContent />
      <SearchNavigation onClient={true} />
    </div>
  );
}
