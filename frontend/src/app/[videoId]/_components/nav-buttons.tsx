import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImArrowLeft, ImArrowRight } from "react-icons/im";
import { useRef, useEffect } from "react";
import { useGlobalContext } from "@/app/context/store";
import { IoIosUndo } from "react-icons/io";

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

function NavButton({ direction }: { direction: "previous" | "next" }) {
  const Icon = direction === "previous" ? ImArrowLeft : ImArrowRight;
  const { gfyViewData, setGfyViewData } = useGlobalContext();
  const leftRef = useRef<HTMLAnchorElement>(null);
  const rightRef = useRef<HTMLAnchorElement>(null);
  const offset = direction === "previous" ? -1 : 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "l") {
        rightRef.current?.click();
      } else if (e.key === "ArrowLeft" || e.key === "h") {
        leftRef.current?.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (gfyViewData && gfyViewData.videoIds.length == 0) {
    return null;
  }

  if (
    direction === "next" &&
    gfyViewData.index >= gfyViewData.videoIds.length - 1
  ) {
    return (
      <Button variant="secondary" disabled>
        <Icon />
      </Button>
    );
  }

  if (direction === "previous" && gfyViewData.index <= 0) {
    return (
      <Button variant="secondary" disabled>
        <Icon />
      </Button>
    );
  }

  return (
    <Link
      href={{
        pathname: `/${gfyViewData.videoIds[gfyViewData.index + offset]}`,
      }}
      ref={direction === "previous" ? leftRef : rightRef}
      replace={true}
      onClick={() => {
        setGfyViewData((old) => {
          return {
            ...old,
            index: old.index + offset,
          };
        });
      }}
    >
      <Button variant="secondary">
        <Icon />
      </Button>
    </Link>
  );
}
