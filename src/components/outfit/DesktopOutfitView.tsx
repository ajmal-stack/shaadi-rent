"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles, Package } from "lucide-react";
import { OutfitGallery } from "./OutfitGallery";
import { OutfitMeasurements, MeasurementsData } from "./OutfitMeasurements";
import { OutfitAvailability, AvailabilityWindow } from "./OutfitAvailability";
import { OutfitActionCard } from "./OutfitActionCard";
import { SimilarOutfits } from "./SimilarOutfits";
import type { OutfitCardData } from "@/components/browse/OutfitCard";

export interface DesktopOutfitViewProps {
  outfit: {
    id: string;
    owner_id: string;
    title: string;
    slug: string;
    description: string | null;
    brand: string | null;
    rental_price: number;
    purchase_price: number | null;
    security_deposit: number;
    size: string | null;
    condition: string;
    color: string | null;
    city: string | null;
    state: string | null;
    district?: string | null;
    images?: Array<{
      id: string;
      storage_path: string;
      image_type: string;
      sort_order: number;
    }> | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    gender_type: string;
  } | null;
  measurements?: MeasurementsData | null;
  availability?: AvailabilityWindow[] | null;
  isOutfitWishlisted: boolean;
  primaryImageUrl?: string;
  similarOutfits: OutfitCardData[];
  wishlistedIds: string[];
}

export function DesktopOutfitView({
  outfit,
  category,
  measurements,
  availability = [],
  isOutfitWishlisted,
  primaryImageUrl,
  similarOutfits,
  wishlistedIds,
}: DesktopOutfitViewProps) {
  // Shared wedding event date between left availability calendar and right booking action card
  const [selectedDate, setSelectedDate] = useState<string>("");

  return (
    <div className="min-h-screen bg-stone-50/50 py-8 sm:py-12 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Breadcrumbs ── */}
        <nav
          aria-label="Breadcrumbs"
          className="flex items-center gap-2 text-xs text-stone-500 mb-8 overflow-x-auto whitespace-nowrap"
        >
          <Link href="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-stone-300 shrink-0" />
          <Link href="/browse" className="hover:text-stone-900 transition-colors">
            Browse
          </Link>
          {category && (
            <>
              <ChevronRight size={13} className="text-stone-300 shrink-0" />
              <Link
                href={`/browse?category=${category.slug}`}
                className="hover:text-stone-900 transition-colors"
              >
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight size={13} className="text-stone-300 shrink-0" />
          <span className="font-semibold text-stone-900 truncate max-w-xs">
            {outfit.title}
          </span>
        </nav>

        {/* ── Main Layout: Two Columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column (Images, Story, Measurements, Availability, Trust) */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Multi-Angle Image Gallery */}
            <OutfitGallery
              images={outfit.images}
              outfitTitle={outfit.title}
            />

            {/* 2. Garment Story & Description */}
            <div className="rounded-3xl border border-rose-100/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-xs font-semibold text-rose-800">
                <Sparkles size={12} className="text-amber-600" />
                Couture Details
              </span>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
                Design &amp; Craftsmanship
              </h2>

              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {outfit.description ||
                  "Handcrafted with exquisite attention to detail. Featuring traditional zardozi embroidery and royal motifs on premium fabric. Tailored for wedding celebrations, pheras, and grand reception evenings."}
              </p>

              {/* Garment Highlights Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-stone-100 text-xs">
                {outfit.color && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Color
                    </span>
                    <span className="font-semibold text-stone-800">{outfit.color}</span>
                  </div>
                )}
                {category?.gender_type && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Occasion
                    </span>
                    <span className="font-semibold text-stone-800 capitalize">
                      {category.gender_type} Wear
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">
                    Authenticity
                  </span>
                  <span className="font-semibold text-emerald-700">
                    100% Certified Original
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Measurements & Alteration Specs */}
            <OutfitMeasurements
              measurements={measurements}
              size={outfit.size}
            />

            {/* 4. Left Availability Schedule (In live sync with booking card) */}
            <OutfitAvailability
              availability={availability}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {/* 5. Safe Owner & Location Context */}
            <div className="rounded-3xl border border-rose-100/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900">
                    Curated by Verified Partner
                  </h3>
                  <p className="text-xs text-stone-500">
                    Location: {outfit.city ? `${outfit.city}, ${outfit.state || "India"}` : "Pan-India Hub"}
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                This piece is listed by a verified boutique partner in our luxury rental network. Every dispatch is backed by the <strong className="text-stone-900">ShaadiRent Quality Shield</strong> with secure insured transit and doorstep exchange if fit issues arise.
              </p>
            </div>
          </div>

          {/* Right Column (Sticky Action Card with Embedded Live Dynamic Calendar) */}
          <div className="lg:col-span-5">
            <OutfitActionCard
              outfit={{
                id: outfit.id,
                owner_id: outfit.owner_id,
                title: outfit.title,
                slug: outfit.slug,
                brand: outfit.brand,
                rental_price: outfit.rental_price,
                purchase_price: outfit.purchase_price,
                security_deposit: outfit.security_deposit,
                size: outfit.size,
                condition: outfit.condition,
                city: outfit.city,
                state: outfit.state,
                categoryName: category?.name,
                imageUrl: primaryImageUrl,
              }}
              availability={availability}
              initialWishlisted={isOutfitWishlisted}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        </div>

        {/* ── Similar Outfits in Same Category ── */}
        <SimilarOutfits
          outfits={similarOutfits}
          categoryName={category?.name}
          categorySlug={category?.slug}
          wishlistedIds={wishlistedIds}
        />
      </div>
    </div>
  );
}
