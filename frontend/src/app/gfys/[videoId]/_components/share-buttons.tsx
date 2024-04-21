import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn, copyToClipboard } from "@/lib/utils";
import { MdOutlineContentCopy } from "react-icons/md";

type ToastType = ReturnType<typeof useToast>["toast"];

export default function ShareButtons({
  imgurId,
  videoUrl,
}: {
  imgurId: string;
  videoUrl: string;
}) {
  const { toast } = useToast();

  return (
    <div className="flex justify-center gap-2">
      <ShareButton
        url={`https://imgur.com/${imgurId}.mp4`}
        text={"Imgur"}
        toast={toast}
      />
      {!videoUrl.includes("imgur") && (
        <ShareButton url={videoUrl} text={"HQ"} toast={toast} />
      )}
    </div>
  );
}

function ShareButton({
  url,
  text,
  toast,
}: {
  url: string;
  text: string;
  toast: ToastType;
}) {
  return (
    <Button
      variant="secondary"
      className={cn("text-bold")}
      onClick={() => handleCopy(url, toast)}
    >
      <span className="flex items-center gap-2">
        <MdOutlineContentCopy />
        <span>{text}</span>
      </span>
    </Button>
  );
}

async function handleCopy(url: string, toast: ToastType) {
  try {
    await copyToClipboard(url);
    toast({
      className: cn(
        "fixed right-0 top-0 flex md:right-4 md:top-4 md:max-w-[420px]"
      ),
      variant: "default",
      description: `Copied ${url} to clipboard!`,
      duration: 1500,
    });
  } catch {
    toast({
      className: cn(
        "fixed right-0 top-0 flex md:right-4 md:top-4 md:max-w-[420px]"
      ),
      variant: "default",
      description: "Failed to copy link to clipboard",
      duration: 1500,
    });
  }
}
