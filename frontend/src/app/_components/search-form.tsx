"use client";
import SearchNav from "./search-nav";
import SearchFormContent from "./search-form-content";

export default function SearchForm() {
  return (
    <div className="flex flex-col items-center">
      <SearchFormContent />
      <SearchNav onClient={true} />
    </div>
  );
}
