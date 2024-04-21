import { emojifyText } from "@/lib/utils";
import { useState, useMemo } from "react";
import EmojifyButtons from "./emojify-buttons";

type OutputFieldProps = {
  messageInput: string;
  emojisInput: string;
  setEmojisInput: (emojisInput: string) => void;
};

export default function OutputField({
  messageInput,
  emojisInput,
  setEmojisInput,
}: OutputFieldProps) {
  const [output, setOutput] = useState<string>("");

  useMemo(() => {
    setOutput(emojifyText(messageInput, emojisInput));
  }, [messageInput, emojisInput]);

  return (
    <>
      <div className="flex justify-between">
        <EmojifyButtons
          messageInput={messageInput}
          emojisInput={emojisInput}
          setEmojisInput={setEmojisInput}
          setOutput={setOutput}
          output={output}
        />
      </div>
      <span className="rounded-md border-2 p-2">{output}</span>
    </>
  );
}
