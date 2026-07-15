import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UIProvider } from "@/components/ui/UIProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { UserSyncServer } from "@/components/users/UserSyncServer";
import { TooltipProvider } from "@/components/ui/tooltip";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rpmaccesorios.com.ar"),
  title: {
    default: "RPM Accesorios | Equipamiento Vehicular Premium",
    template: "%s | RPM Accesorios"
  },
  description: "Expertos en iluminación LED, estética y equipamiento off-road en Tucumán. Más de 15 años transformando vehículos con precisión y performance.",
  keywords: ["accesorios autos", "iluminación led tucumán", "ppf tucumán", "off-road", "estética vehicular", "RPM Accesorios"],
  authors: [{ name: "RPM Accesorios" }],
  creator: "RPM Accesorios",
  publisher: "RPM Accesorios",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://rpmaccesorios.com.ar",
    siteName: "RPM Accesorios",
    title: "RPM Accesorios | Equipamiento Vehicular Premium",
    description: "Expertos en iluminación LED, estética y equipamiento off-road en Tucumán.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "RPM Accesorios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RPM Accesorios | Equipamiento Vehicular Premium",
    description: "Expertos en iluminación LED, estética y equipamiento off-road en Tucumán.",
    images: ["/logo.png"],
  },
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
              <UserSyncServer />
              {children}
            </UIProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
