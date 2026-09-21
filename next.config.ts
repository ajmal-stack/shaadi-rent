import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Google profile avatars provided by OAuth
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        // Supabase storage bucket images
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
      {
        // Unsplash curated images if referenced
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Cloudinary CDN — outfit images uploaded via the listing wizard
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/owner/listings",
        destination: "/listings",
        permanent: true,
      },
      {
        source: "/owner/dashboard",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/owner/requests",
        destination: "/requests",
        permanent: true,
      },
      {
        source: "/owner/earnings",
        destination: "/earnings",
        permanent: true,
      },
      {
        source: "/owner",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
