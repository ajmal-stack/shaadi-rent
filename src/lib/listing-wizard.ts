/**
 * Listing Wizard — shared draft types and localStorage helpers.
 *
 * The wizard stores in-progress state client-side in localStorage under a
 * single key. Step pages read from and write to this store so the owner can
 * navigate back/forward without losing data.
 *
 * The outfitId is written here as soon as Step 1 creates the DB record.
 * Subsequent steps use it to upsert measurements, images, etc.
 */

export const DRAFT_STORAGE_KEY = "shaadi-rent-listing-draft";

// ── Draft shape ──────────────────────────────────────────────────────────────

export interface DraftDetails {
  categoryId: string;
  title: string;
  description: string;
  brand: string;
  color: string;
  size: string;
  condition: "like_new" | "excellent" | "good";
  city: string;
  district: string;
  state: string;
}

export interface DraftMeasurements {
  bust: string;
  waist: string;
  hip: string;
  shoulder: string;
  length: string;
  sleeve_length: string;
}

export interface DraftPhoto {
  /** Local object URL (before upload) or Supabase storage path (after upload) */
  preview: string;
  /** null while pending upload; storage_path after upload */
  storagePath: string | null;
  /** DB record id after insert */
  imageId: string | null;
  /** image_type enum value */
  imageType:
    | "front"
    | "back"
    | "side"
    | "detail"
    | "label"
    | "damage"
    | "other";
  sortOrder: number;
}

export interface DraftPricing {
  rentalPrice: string;
  securityDeposit: string;
  purchasePrice: string;
}

export interface DraftAvailabilityWindow {
  startDate: string; // ISO date "YYYY-MM-DD"
  endDate: string;
  status: "available" | "blocked";
}

export interface ListingDraft {
  /** DB outfit id — null until Step 1 creates the record */
  outfitId: string | null;
  /** Wizard step last saved to DB: 0 = nothing, 1 = details saved, etc. */
  stepSaved: number;
  details: Partial<DraftDetails>;
  measurements: Partial<DraftMeasurements>;
  photos: DraftPhoto[];
  primaryPhotoIndex: number;
  pricing: Partial<DraftPricing>;
  availability: DraftAvailabilityWindow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function emptyDraft(): ListingDraft {
  return {
    outfitId: null,
    stepSaved: 0,
    details: {},
    measurements: {},
    photos: [],
    primaryPhotoIndex: 0,
    pricing: {},
    availability: [],
  };
}

export function loadDraft(): ListingDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return emptyDraft();
    return JSON.parse(raw) as ListingDraft;
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(draft: ListingDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // localStorage quota exceeded — silently fail
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function updateDraft(patch: Partial<ListingDraft>): ListingDraft {
  const current = loadDraft();
  const updated = { ...current, ...patch };
  saveDraft(updated);
  return updated;
}

// ── Step meta ─────────────────────────────────────────────────────────────────

export const WIZARD_STEPS = [
  { number: 1, label: "Details", href: "/list-your-outfit/details" },
  { number: 2, label: "Measurements", href: "/list-your-outfit/measurements" },
  { number: 3, label: "Photos", href: "/list-your-outfit/photos" },
  { number: 4, label: "Pricing", href: "/list-your-outfit/pricing" },
  { number: 5, label: "Availability", href: "/list-your-outfit/availability" },
  { number: 6, label: "Preview", href: "/list-your-outfit/preview" },
] as const;

export type WizardStepNumber = 1 | 2 | 3 | 4 | 5 | 6;
