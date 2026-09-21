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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (window.location.pathname.startsWith('/admin')) {
                  var t = localStorage.getItem('shaadi_admin_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (t === 'dark' || (t !== 'light' && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
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
