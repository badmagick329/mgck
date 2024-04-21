import { Button } from "@/components/ui/button";
import { DEFAULT_EMOJIS } from "@/lib/consts";
import { useToast } from "@/components/ui/use-toast";
import { cn, emojifyText, copyToClipboard } from "@/lib/utils";

type ToastType = ReturnType<typeof useToast>["toast"];

type EmojifyButtonsProps = {
  messageInput: string;
  emojisInput: string;
  setEmojisInput: (emojisInput: string) => void;
  setOutput: (output: string) => void;
  output: string;
};

export default function EmojifyButtons({
  messageInput,
  emojisInput,
  setEmojisInput,
  setOutput,
  output,
}: EmojifyButtonsProps) {
  const { toast } = useToast();

  return (
    <>
      <Button onClick={() => setOutput(emojifyText(messageInput, emojisInput))}>
        Regenerate
      </Button>
      <Button onClick={() => setEmojisInput(DEFAULT_EMOJIS.join(" "))}>
        Reset
      </Button>
      <Button
        onClick={() => handleCopy(output, toast)}
      >
        Copy
      </Button>
    </>
  );
}

async function handleCopy(text: string, toast: ToastType) {
    try {
      await copyToClipboard(text);
      toast({
        className: cn(
          "fixed right-0 top-0 flex md:right-4 md:top-4 md:max-w-[420px]"
        ),
        variant: "default",
        description: `Copied to clipboard`,
        duration: 1000,
      });
    } catch (error) {
      toast({
        className: cn(
          "fixed right-0 top-0 flex md:right-4 md:top-4 md:max-w-[420px]"
        ),
        variant: "default",
        description: `Failed to copy to clipboard`,
        duration: 1000,
      });
    }
}
