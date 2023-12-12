"use client";
import { fetchGfy } from "@/actions/actions";
import { Button } from "@/components/ui/button";
import { GfyDetailResponse } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useGlobalContext } from "@/app/context/store";
import { ImArrowLeft, ImArrowRight } from "react-icons/im";
import Loading from "@/app/loading";
import { ThemeToggler } from "@/components/ThemeToggler";

type Props = {
  params: {
    videoId: string;
  };
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

  const fetchDetails = async () => {
    const gfyDetail = await fetchGfy(props.params.videoId);
    setGfyDetail(gfyDetail);
  };

  useEffect(() => {
    fetchDetails();
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
          pathname: `/gfy/${gfyViewData.videoIds[gfyViewData.index + offset]}`,
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
        <div className="flex flex-col items-center justify-center h-screen max-w-screen m-0">
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

  function mobileView() {
    if (!gfyDetail) {
      return (
        <div className="flex flex-col items-center justify-center h-screen max-w-screen m-0">
          <Loading />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-between h-screen max-w-screen m-0">
        <div className="flex flex-col w-full h-4/5 justify-center">
          {renderPlayer()}
        </div>
        <div className="flex flex-col w-full h-1/5 justify-center py-2">
          <div className="hidden xs:flex flex-wrap justify-center gap-2 py-2 overflow-y-scroll">
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
                    <span className="py-1 sm:py-2 sm:px-1 border-2 rounded-lg hover:cursor text-sm bg-gray-400 text-black dark:bg-gray-800 dark:text-white">
                      {t}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
          <div className="flex w-full space-x-2 justify-center py-2">
            {renderNavButton("previous")}
            {renderNavButton("next")}
            {gfyViewData?.listUrl && (
              <Link ref={backRef} href={gfyViewData.listUrl}>
                <Button variant="secondary">Back</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  function desktopView() {
    if (!gfyDetail) {
      return (
        <div className="flex flex-col items-center justify-center h-screen max-w-screen m-0">
          <Loading />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-screen max-w-screen m-0">
        <div className="flex w-full h-full justify-between">
          <div className="flex w-4/5 justify-center">{renderPlayer()}</div>
          <div className="hidden md:w-1/5 md:flex md:flex-wrap md:flex-col h-full justify-between">
            <div className="flex flex-col space-y-2 p-2 w-full max-h-full">
              {windowHeight > MOBILE_BREAKPOINT && (
                <div className="flex justify-end">
                  <div className="px-4">
                    <ThemeToggler />
                  </div>
                </div>
              )}
              {windowHeight > MOBILE_BREAKPOINT && (
                <span className="text-sm lg:text-base xl:text-xl break-words">
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
                            <span className="py-1 sm:py-2 sm:px-1 border-2 rounded-lg hover:cursor text-sm bg-gray-400 text-black dark:bg-gray-800 dark:text-white">
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
            </div>
            <div className="flex w-full flex-wrap gap-2 justify-center py-2">
              {renderNavButton("previous")}
              {renderNavButton("next")}
              {gfyViewData?.listUrl && (
                <Link ref={backRef} href={gfyViewData.listUrl}>
                  <Button variant="secondary">Back</Button>
                </Link>
              )}
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
