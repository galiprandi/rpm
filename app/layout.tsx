import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UIProvider } from "@/components/ui/UIProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { UserSyncServer } from "@/components/users/UserSyncServer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DebugConsoleHelper } from "@/components/DebugConsoleHelper";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RPM Accesorios",
  description: "RPM Accesorios - En desarrollo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <TooltipProvider>
            <UIProvider>
              <DebugConsoleHelper />
              <UserSyncServer />
              {children}
            </UIProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
