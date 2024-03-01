"use client";
import { useGlobalContext } from "@/app/context/store";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import NavButton from "./nav-button";

export default function SearchNavigation({ onClient }: { onClient: boolean }) {
  const { data } = useGlobalContext();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pathname = usePathname();
  const leftRef = useRef<HTMLAnchorElement>(null);
  const rightRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!onClient) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      const inputs = document.querySelectorAll("input");
      for (let i = 0; i < inputs.length; i++) {
        if (inputs[i] === document.activeElement) {
          return;
        }
      }
      if (e.key === "ArrowLeft" || e.key === "h") {
        leftRef.current?.click();
      } else if (e.key === "ArrowRight" || e.key === "l") {
        rightRef.current?.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (data.next) {
      const url = new URL(data.next);
      const page = url.searchParams.get("page");
      if (page) {
        setCurrentPage(parseInt(page) - 1);
      }
    } else if (data.previous) {
      const url = new URL(data.previous);
      const page = url.searchParams.get("page");
      if (page) {
        setCurrentPage(parseInt(page) + 1);
      }
    }
  }, [data]);

  return (
    <div className="mt-4 flex flex-col items-center space-y-2">
      <div className="flex justify-center space-x-2">
        <NavButton
          url={data.previous}
          prevURL={data.previous}
          nextURL={data.next}
          totalPages={data.totalPages}
          navType="first"
          leftRef={leftRef}
          rightRef={rightRef}
          pathname={pathname}
        />
        <NavButton
          url={data.previous}
          prevURL={data.previous}
          nextURL={data.next}
          totalPages={data.totalPages}
          navType="previous"
          leftRef={leftRef}
          rightRef={rightRef}
          pathname={pathname}
        />
        <NavButton
          url={data.next}
          prevURL={data.previous}
          nextURL={data.next}
          totalPages={data.totalPages}
          navType="next"
          leftRef={leftRef}
          rightRef={rightRef}
          pathname={pathname}
        />
        <NavButton
          url={data.next}
          prevURL={data.previous}
          nextURL={data.next}
          totalPages={data.totalPages}
          navType="last"
          leftRef={leftRef}
          rightRef={rightRef}
          pathname={pathname}
        />
      </div>
      <PaginationText currentPage={currentPage} totalPages={data.totalPages} />
    </div>
  );
}

function PaginationText({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <div className="text-gray-800 dark:text-gray-500">
      Page {currentPage} of {totalPages}
    </div>
  );
}
