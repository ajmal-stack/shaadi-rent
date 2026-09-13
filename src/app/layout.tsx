import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: {
    default: "ShaadiRent",
    template: "%s — ShaadiRent",
  },
  description: "Wedding Outfits on Rent — Rent. Wear. Return.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        suppressHydrationWarning={true}
        className="min-h-screen bg-white text-gray-900 antialiased pb-20 md:pb-0"
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
