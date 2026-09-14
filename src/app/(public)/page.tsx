import { HeroSection } from "@/components/home/HeroSection";
import { TrustRibbon } from "@/components/home/TrustRibbon";
import { BentoGrid } from "@/components/home/BentoGrid";
import { TrendingOutfits } from "@/components/home/TrendingOutfits";
import { HowItWorksSteps } from "@/components/home/HowItWorksSteps";
import { LenderCallout } from "@/components/home/LenderCallout";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* 1. Cinematic Hero with Interactive Rental Finder */}
      <HeroSection />

      {/* 2. Trust & Anxiety Reduction Ribbon */}
      <TrustRibbon />

      {/* 3. 2025-2026 Trend: Curated Bento Box Collections */}
      <BentoGrid />

      {/* 4. Price Anchoring: Trending Wedding Rentals (Rent vs MRP) */}
      <TrendingOutfits />

      {/* 5. Seamless 4-Step Rental Timeline */}
      <HowItWorksSteps />

      {/* 6. Peer-to-Peer Closet Monetization Banner */}
      <LenderCallout />

      {/* 7. Real Brides & Grooms Social Proof */}
      <TestimonialsSection />
    </main>
  );
}
