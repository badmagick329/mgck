import type { Metadata } from "next";
import { GlobalContextProvider } from "@/app/gfys/context/store";

export const metadata: Metadata = {
  title: "Kpop comebacks",
};

import { Toaster } from "@/components/ui/toaster";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalContextProvider>{children}</GlobalContextProvider>
      <Toaster />
    </>
  );
}
