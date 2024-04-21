import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  GFYS_BASE,
  KPOP_BASE,
  URL_SHORTENER_BASE,
  EMOJIFY_BASE,
} from "@/lib/consts/urls";

const pageLinks = [
  [GFYS_BASE, "Gfys"],
  [KPOP_BASE, "Kpop Comebacks"],
  [EMOJIFY_BASE, "Emojify your message 😀"],
  [URL_SHORTENER_BASE, "URL Shortener"],
];

export default function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center space-y-4">
      {pageLinks.map((entry) => {
        const [url, message] = entry;
        return (
          <Link href={url}>
            <Button className="w-96 text-lg font-semibold">{message}</Button>
          </Link>
        );
      })}
    </main>
  );
}
