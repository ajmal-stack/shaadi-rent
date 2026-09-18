import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { PwaRegistrar } from "@/components/pwa/PwaRegistrar";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "ShaadiRent",
  title: {
    default: "ShaadiRent — Wedding Outfits on Rent",
    template: "%s — ShaadiRent",
  },
  description: "Wedding Outfits on Rent — Rent. Wear. Return. Designer bridal lehengas, sherwanis, and wedding couture.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShaadiRent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#9F1239",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning={true}>
      <body
        suppressHydrationWarning={true}
        className="min-h-screen flex flex-col bg-white text-gray-900 antialiased"
      >
        <Toaster richColors position="top-right" closeButton />
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
