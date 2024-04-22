import Image from "next/image";
import { useGlobalContext } from "@/app/gfys/context/store";
import { imgurIdToJpg, imgurIdToMp4 } from "@/lib/utils/gfys";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GFYS_BASE } from "@/lib/consts/urls";

export default function GfyPreview({
  title,
  imgurId,
  index,
  width,
  height,
}: {
  title: string;
  imgurId: string;
  index: number;
  width: number | null;
  height: number | null;
}) {
  const { gfyViewData, setGfyViewData } = useGlobalContext();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Link
              href={{
                pathname: `${GFYS_BASE}/${imgurId}`,
              }}
              onClick={() => {
                setGfyViewData({
                  ...gfyViewData,
                  index,
                });
              }}
            >
              <Image
                className="rounded-md object-cover hover:cursor-pointer hover:ring-2
                  hover:ring-indigo-500 hover:ring-offset-2"
                src={imgurIdToJpg(imgurId)}
                alt="imgur"
                width={150}
                height={150}
                style={{ width: "150px", height: "150px" }}
                quality={75}
                unoptimized
              />
            </Link>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-2">
            <p className="max-w-[250px] break-words">{title}</p>
            <div className="flex justify-center rounded-md p-2">
              <VideoComponent imgurId={imgurId} width={width} height={height} />
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function VideoComponent({ imgurId, width, height }: { imgurId: string, width: number | null, height: number | null }) {
  const maxVideoWidth = 400
  if (width === null || height === null) {
    return (
      <video className="rounded-md" autoPlay loop muted width={(maxVideoWidth / 2).toString()}>
        <source src={imgurIdToMp4(imgurId)} />
      </video>
    )
  }

  if (width > height) {
    return (
      <video className="rounded-md" autoPlay loop muted width={maxVideoWidth.toString()}>
        <source src={imgurIdToMp4(imgurId)} />
      </video>
    )
  }

  if (width <= height) {
    const widthDivisor = height / maxVideoWidth
    const videoWidth = Math.round(width / widthDivisor)
    return (
      <video className="rounded-md" autoPlay loop muted width={videoWidth}>
        <source src={imgurIdToMp4(imgurId)} />
      </video>
    )
  }
}
