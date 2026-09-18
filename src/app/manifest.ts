import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShaadiRent — Wedding Outfits on Rent",
    short_name: "ShaadiRent",
    description: "Rent luxury designer wedding lehengas, sherwanis, sarees & bridal couture.",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#9F1239",
    orientation: "portrait",
    scope: "/",
    lang: "en",
    dir: "ltr",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Browse Outfits",
        short_name: "Outfits",
        description: "Explore rental bridal & groom outfits",
        url: "/browse",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "My Account",
        short_name: "Account",
        description: "View bookings and account details",
        url: "/account",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "List Your Wardrobe",
        short_name: "Boutique",
        description: "Become a verified boutique owner",
        url: "/owner/apply",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
