"use client";
import { Button } from "@/components/ui/button";
import { GfyDetailResponse } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useGlobalContext } from "@/app/context/store";
import { ImArrowLeft, ImArrowRight } from "react-icons/im";
import Loading from "@/app/loading";
import { ThemeToggler } from "@/components/theme-toggler";
import { cn, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { MdOutlineContentCopy } from "react-icons/md";

type Props = {
  params: {
    videoId: string;
  };
  gfyDetail: GfyDetailResponse;
};

type NavDirection = "previous" | "next";

export default function GfyView(props: Props) {
  const [gfyDetail, setGfyDetail] = useState<GfyDetailResponse | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [windowHeight, setWindowHeight] = useState<number>(0);
  const { gfyViewData, setGfyViewData, videoVolume, setVideoVolume } =
    useGlobalContext();
  const [videoLoading, setVideoLoading] = useState<boolean>(true);
  const leftRef = useRef<HTMLAnchorElement>(null);
  const rightRef = useRef<HTMLAnchorElement>(null);
  const backRef = useRef<HTMLAnchorElement>(null);
  const MOBILE_BREAKPOINT = 768;
  const { toast } = useToast();

  useEffect(() => {
    setGfyDetail(props.gfyDetail);
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    handleResize();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "l") {
        rightRef.current?.click();
      } else if (e.key === "ArrowLeft" || e.key === "h") {
        leftRef.current?.click();
      } else if (e.key === "ArrowDown" || e.key === "j") {
        backRef.current?.click();
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function renderNavButton(direction: NavDirection) {
    const Icon = direction === "previous" ? ImArrowLeft : ImArrowRight;
    if (gfyViewData && gfyViewData.videoIds.length == 0) {
      return <></>;
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
    const offset = direction === "previous" ? -1 : 1;
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

  function renderPlayer() {
    if (!gfyDetail) {
      return (
        <div className="max-w-screen m-0 flex h-screen flex-col items-center justify-center">
          <Loading />
        </div>
      );
    }
    return (
      <video
        className={videoLoading ? "hidden" : "block"}
        onLoadedData={(e) => {
          setVideoLoading(false);
          videoVolume === 0
            ? (e.currentTarget.muted = true)
            : (e.currentTarget.volume = videoVolume);
        }}
        onVolumeChange={(e) => {
          e.currentTarget.muted
            ? setVideoVolume(0)
            : setVideoVolume(e.currentTarget.volume);
        }}
        controls
        autoPlay
        loop
        {...(videoVolume === 0 ? { muted: true } : {})}
      >
        <source src={gfyDetail.video_url} type="video/mp4" />
      </video>
    );
  }

  function renderDesktopDetails() {
    if (!gfyDetail) {
      return <></>;
    }
    return (
      <>
        {windowHeight > MOBILE_BREAKPOINT && (
          <div className="flex justify-end">
            <div className="px-4">
              <ThemeToggler />
            </div>
          </div>
        )}
        {windowHeight > MOBILE_BREAKPOINT && (
          <span className="break-words text-sm lg:text-base xl:text-xl">
            {gfyDetail.title}
          </span>
        )}
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-2 py-2">
            {windowHeight > MOBILE_BREAKPOINT &&
              gfyDetail.tags.map((t, key) => {
                return (
                  <Link
                    key={key}
                    href={{
                      pathname: "/",
                      query: { tags: t },
                    }}
                  >
                    <div className="my-2">
                      <span className="hover:cursor rounded-lg border-2 bg-gray-400 py-1 text-sm text-black dark:bg-gray-800 dark:text-white sm:px-1 sm:py-2">
                        {t}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
        {gfyDetail.date && windowHeight > MOBILE_BREAKPOINT && (
          <span className="text-sm lg:text-base xl:text-xl">
            <strong>Date:</strong> {gfyDetail.date}
          </span>
        )}
        {windowHeight > MOBILE_BREAKPOINT && (
          <span className="text-sm lg:text-base xl:text-xl">
            <strong>Account:</strong> {gfyDetail.account}
          </span>
        )}
      </>
    );
  }

  function renderNavButtons() {
    return (
      <div className="flex w-full flex-wrap justify-center gap-2 py-2">
        {renderNavButton("previous")}
        {renderNavButton("next")}
        {gfyViewData?.listUrl && (
          <Link ref={backRef} href={gfyViewData.listUrl}>
            <Button variant="secondary">Back</Button>
          </Link>
        )}
      </div>
    );
  }

  function renderShareButton(url: string, text: string) {
    return (
      <Button
        variant="secondary"
        className="text-bold w-24"
        onClick={() =>
          copyToClipboard(url)
            .then((res) => {
              toast({
                className: cn(
                  "fixed right-0 top-0 flex md:right-4 md:top-4 md:max-w-[420px]"
                ),
                variant: "default",
                description: `Copied ${url} to clipboard!`,
                duration: 3000,
              });
            })
            .catch((err) => {
              toast({
                className: cn(
                  "fixed right-0 top-0 flex md:right-4 md:top-4 md:max-w-[420px]"
                ),
                variant: "default",
                description: "Failed to copy link to clipboard 😔",
                duration: 3000,
              });
            })
        }
      >
        <span className="flex w-full items-center justify-center gap-2">
          <MdOutlineContentCopy />
          <span>{text}</span>
        </span>
      </Button>
    );
  }

  function renderShareButtons() {
    return (
      <div className="flex flex-wrap justify-center gap-2 py-2">
        {gfyDetail?.imgur_id &&
          renderShareButton(
            `https://imgur.com/${gfyDetail?.imgur_id}.mp4`,
            "Imgur"
          )}
        {gfyDetail?.video_url &&
          gfyDetail?.video_url.includes("imgur") === false &&
          renderShareButton(gfyDetail?.video_url, "HQ")}
      </div>
    );
  }

  function mobileView() {
    if (!gfyDetail) {
      return (
        <div className="max-w-screen m-0 flex h-screen flex-col items-center justify-center">
          <Loading />
        </div>
      );
    }
    return (
      <div className="max-w-screen m-0 flex h-screen flex-col items-center justify-between">
        <div className="flex h-4/5 w-full flex-col justify-center">
          {renderPlayer()}
        </div>
        <div className="flex h-1/5 w-full flex-col justify-center py-2">
          <div className="hidden flex-wrap justify-center gap-2 overflow-y-scroll py-2 xs:flex">
            {windowHeight > MOBILE_BREAKPOINT &&
              gfyDetail.tags.map((t, key) => (
                <Link
                  key={key}
                  href={{
                    pathname: "/",
                    query: { tags: t },
                  }}
                >
                  <div className="my-2">
                    <span className="hover:cursor rounded-lg border-2 bg-gray-400 py-1 text-sm text-black dark:bg-gray-800 dark:text-white sm:px-1 sm:py-2">
                      {t}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
          <div className="flex flex-col">
            {renderShareButtons()}
            {renderNavButtons()}
          </div>
        </div>
      </div>
    );
  }

  function desktopView() {
    if (!gfyDetail) {
      return (
        <div className="max-w-screen m-0 flex h-screen flex-col items-center justify-center">
          <Loading />
        </div>
      );
    }
    return (
      <div className="max-w-screen m-0 flex h-screen flex-col items-center justify-center">
        <div className="flex h-full w-full justify-between">
          <div className="flex w-4/5 justify-center">{renderPlayer()}</div>
          <div className="hidden h-full justify-between md:flex md:w-1/5 md:flex-col md:flex-wrap">
            <div className="flex max-h-full w-full flex-col space-y-2 p-2">
              {renderDesktopDetails()}
            </div>
            <div className="flex flex-col">
              {renderShareButtons()}
              {renderNavButtons()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (windowWidth > MOBILE_BREAKPOINT) {
    return desktopView();
  } else {
    return mobileView();
  }
}
