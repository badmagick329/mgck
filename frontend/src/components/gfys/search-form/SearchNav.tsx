"use client";
import { useGlobalContext } from "@/app/context/store";
import { usePathname } from "next/navigation";
import { createURL } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImArrowLeft, ImArrowRight } from "react-icons/im";
import { useRef, useEffect } from "react";

type IconType = typeof ImArrowLeft | typeof ImArrowRight;

type Props = {
  attachListeners: boolean;
}

export default function SearchNav({ attachListeners }: Props) {
  const { data } = useGlobalContext();
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

  function renderNavButton(url: string | null, Icon: IconType, ref: any) {
    if (!data.previous && !data.next) {
      return <></>;
    }
    if (url) {
      return (
        <Link ref={ref} href={createURL(pathname, url.split("?")[1])}>
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

  return (
    <div className="flex space-x-2 justify-center my-4">
      {renderNavButton(data.previous, ImArrowLeft, leftRef)}
      {renderNavButton(data.next, ImArrowRight, rightRef)}
    </div>
  );
}
