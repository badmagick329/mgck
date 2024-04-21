"use client";
import { ThemeToggler } from "@/components/theme-toggler";
import MessageField from "./_components/message-field";
import EmojisField from "./_components/emojis-field";
import OutputField from "./_components/output-field";
import { useState, useEffect } from "react";
import useLocalStorage from "@/hooks/use-local-storage";
import { DEFAULT_EMOJIS } from "@/lib/consts";
import { emojifyText } from "@/lib/utils";

const plainHeaderMessage = "Emojify Your Message";

export default function EmojifyPage() {
  const [messageInput, setMessageInput] = useState("");
  const [headerMessage, setHeaderMessage] = useState(plainHeaderMessage);
  const [emojisInput, setEmojisInput] = useLocalStorage(
    "defaultEmojis",
    DEFAULT_EMOJIS.join(" ")
  );

  useEffect(() => {
    setHeaderMessage(emojifyText(plainHeaderMessage, emojisInput));
    const cancelTimer = setInterval(() => {
      setHeaderMessage(emojifyText(plainHeaderMessage, emojisInput));
    }, 1000);
    return () => clearInterval(cancelTimer);
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col">
      <div className="self-end p-2">
        <ThemeToggler />
      </div>
      <div className="flex flex-grow flex-col items-center justify-center">
        <div className="flex w-full max-w-[800px] flex-col gap-4">
          <span className="flex justify-center text-2xl">{headerMessage}</span>
          <MessageField
            messageInput={messageInput}
            setMessageInput={setMessageInput}
          />
          <EmojisField
            emojisInput={emojisInput}
            setEmojisInput={setEmojisInput}
          />
          <OutputField
            messageInput={messageInput}
            emojisInput={emojisInput}
            setEmojisInput={setEmojisInput}
          />
        </div>
      </div>
    </main>
  );
}
