import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ShaadiRent",
    template: "%s — ShaadiRent",
  },
  description: "Wedding Outfits on Rent — Rent. Wear. Return.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
        {children}
      </body>
    </html>
  );
}
