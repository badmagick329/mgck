import Image from "next/image";
import { useGlobalContext } from "@/app/gfys/context/store";
import { imgurIdToJpg, imgurIdToMp4 } from "@/lib/utils";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GFYS_BASE } from "@/lib/consts";

export default function GfyPreview({
  title,
  imgurId,
  index,
}: {
  title: string;
  imgurId: string;
  index: number;
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
            <div className="flex justify-center p-2 rounded-md">
              <video className="rounded-md" autoPlay loop muted width="200">
                <source src={imgurIdToMp4(imgurId)} />
              </video>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
