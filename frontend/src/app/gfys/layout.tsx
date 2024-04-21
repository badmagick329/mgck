import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
const inter = Inter({ subsets: ["latin"] });
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalContextProvider>{children}</GlobalContextProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
