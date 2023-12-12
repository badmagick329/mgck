"use client";
import { useGlobalContext } from "@/app/context/store";
import { usePathname } from "next/navigation";
import { createURL } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ImArrowLeft,
  ImArrowRight,
  ImBackward2,
  ImForward3,
} from "react-icons/im";
import { useRef, useEffect, useState } from "react";

type IconType =
  | typeof ImArrowLeft
  | typeof ImArrowRight
  | typeof ImBackward2
  | typeof ImForward3;

type Props = {
  attachListeners: boolean;
};

type NavType = "first" | "previous" | "next" | "last";

export default function SearchNav({ attachListeners }: Props) {
  const { data } = useGlobalContext();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pathname = usePathname();
  const leftRef = useRef<HTMLAnchorElement>(null);
  const rightRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!attachListeners) {
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

  function renderNavButton(url: string | null, navType: NavType) {
    if (!data.previous && !data.next) {
      return <></>;
    }
    let Icon: IconType = ImBackward2;
    let ref: React.RefObject<HTMLAnchorElement> | null = null;
    let asPage = "";
    switch (navType) {
      case "first":
        Icon = ImBackward2;
        asPage = "1";
        break;
      case "previous":
        Icon = ImArrowLeft;
        ref = leftRef;
        break;
      case "next":
        Icon = ImArrowRight;
        ref = rightRef;
        break;
      case "last":
        Icon = ImForward3;
        asPage = data.totalPages.toString();
        break;
    }

    if (url) {
      return (
        <Link ref={ref} href={createURL(pathname, url.split("?")[1], asPage)}>
          <Button variant="secondary">
            <Icon />
          </Button>
        </Link>
      );
    }
    return (
      <Button variant="secondary" disabled>
        <Icon />
      </Button>
    );
  }

  function renderPageText() {
    if (data.totalPages <= 1) {
      return <></>;
    }
    return (
      <div className="text-gray-800 dark:text-gray-500">
        Page {currentPage} of {data.totalPages}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-4 space-y-2">
      <div className="flex space-x-2 justify-center">
        {renderNavButton(data.previous, "first")}
        {renderNavButton(data.previous, "previous")}
        {renderNavButton(data.next, "next")}
        {renderNavButton(data.next, "last")}
      </div>
      {renderPageText()}
    </div>
  );
}
