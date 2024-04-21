import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  GfyData,
  GfyResult,
  GfyResponse,
  GfyParsedResponse,
} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "absolute";
  textArea.style.left = "-999999px";
  document.body.prepend(textArea);
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  } finally {
    textArea.remove();
  }
  return Promise.resolve();
}

/**
 * Take a YYMMDD, YYYYMMDD or YYYY-MM-DD string and return a YYYY-MM-DD string
 * or null if invalid.
 */
export function validDateStringOrNull(date: string) {
  date = date.trim();
  if (date.length !== 6 && date.length !== 8 && date.length !== 10) {
    return null;
  }
  if (date.length === 6) {
    date = `20${date}`;
  }

  if (date.length === 8) {
    date = date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
  }

  if (isNaN(Date.parse(date))) {
    return null;
  }
  return date;
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function emojifyText(message: string, emojisInput: string) {
  if (!message) return "Emojified message will appear here";
  if (!emojisInput) return message;
  const words = message.split(" ").filter((word) => word.length > 0);
  const emojis = emojisInput.split(" ").filter((emoji) => emoji.length > 1);
  const wordsWithEmojis = words.map(
    (word) => `${word} ${randomChoice(emojis)}`
  );
  return wordsWithEmojis.join(" ");
}
