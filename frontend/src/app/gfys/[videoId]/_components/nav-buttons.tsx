import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRef, useEffect } from "react";
import { useGlobalContext } from "@/app/gfys/context/store";
import { IoIosUndo } from "react-icons/io";
import NavButton from "./nav-button";

export default function NavButtons() {
  const backRef = useRef<HTMLAnchorElement>(null);
  const { gfyViewData } = useGlobalContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        backRef.current?.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex justify-center gap-2">
      <NavButton direction="previous" />
      <NavButton direction="next" />
      {gfyViewData?.listUrl && (
        <Link ref={backRef} href={gfyViewData.listUrl}>
          <Button variant="secondary">
            <IoIosUndo />
          </Button>
        </Link>
      )}
    </div>
  );
}
