import type { Metadata } from "next";
import { GlobalContextProvider } from "@/app/gfys/context/store";

export const metadata: Metadata = {
  title: "Red Velvet Gfy Archive",
  description: "Search through Red Velvet Gfys now moved to Imgur",
};

import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalContextProvider>{children}</GlobalContextProvider>
      <Toaster />
    </>
  );
}
