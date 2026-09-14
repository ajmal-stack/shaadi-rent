"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  X,
  Star,
  StarOff,
  AlertCircle,
  Loader2,
  ChevronRight,
  ImagePlus,
} from "lucide-react";
import { loadDraft, saveDraft } from "@/lib/listing-wizard";
import type { DraftPhoto } from "@/lib/listing-wizard";
import {
  saveImageRecord,
  deleteImageRecord,
} from "@/app/(public)/list-your-outfit/actions";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 10;
const MAX_PHOTOS = 10;
const MIN_PHOTOS = 1;

type ImageTypeOption =
  | "front"
  | "back"
  | "side"
  | "detail"
  | "label"
  | "damage"
  | "other";

interface UploadingPhoto {
  file: File;
  preview: string;
  progress: number;
  error: string | null;
}

// ── Cloudinary direct upload ──────────────────────────────────────────────────

/**
 * Uploads a single file directly to Cloudinary via an unsigned upload preset.
 * Uses XMLHttpRequest so we can track real upload progress.
 * Returns the secure_url on success, throws on failure.
 */
function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      reject(
        new Error(
          "Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to .env.local."
        )
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    );

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        // Cap at 95 — the remaining 5% resolves when we receive the response
        onProgress(Math.round((e.loaded / e.total) * 95));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { secure_url: string };
          onProgress(100);
          resolve(data.secure_url);
        } catch {
          reject(new Error("Invalid response from Cloudinary."));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText) as {
            error?: { message?: string };
          };
          reject(
            new Error(err.error?.message ?? `Upload failed (${xhr.status})`)
          );
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload."))
    );
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted.")));

    xhr.send(formData);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PhotoUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [outfitId] = useState<string | null>(() => loadDraft().outfitId);
  const [photos, setPhotos] = useState<DraftPhoto[]>(
    () => loadDraft().photos || []
  );
  const [primaryIndex, setPrimaryIndex] = useState(
    () => loadDraft().primaryPhotoIndex || 0
  );
  const [uploading, setUploading] = useState<UploadingPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    if (!outfitId) {
      router.replace("/list-your-outfit/details");
    }
  }, [outfitId, router]);

  const persistDraft = useCallback(
    (newPhotos: DraftPhoto[], newPrimaryIndex: number) => {
      const draft = loadDraft();
      saveDraft({
        ...draft,
        stepSaved: Math.max(draft.stepSaved, 3),
        photos: newPhotos,
        primaryPhotoIndex: newPrimaryIndex,
      });
    },
    []
  );

  async function uploadFile(file: File, uploadingIndex: number): Promise<void> {
    if (!outfitId) return;

    const imageType: ImageTypeOption =
      photos.length + uploadingIndex === 0 ? "front" : "other";

    const folder = `shaadi-rent/outfits/${outfitId}`;

    let secureUrl: string;
    try {
      secureUrl = await uploadToCloudinary(file, folder, (pct) => {
        setUploading((prev) =>
          prev.map((u, i) =>
            i === uploadingIndex ? { ...u, progress: pct } : u
          )
        );
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed.";
      setUploading((prev) =>
        prev.map((u, i) =>
          i === uploadingIndex
            ? { ...u, error: message, progress: 0 }
            : u
        )
      );
      return;
    }

    // Save the Cloudinary URL to the DB via Server Action
    const sortOrder = photos.length + uploadingIndex;
    const { imageId, error: dbError } = await saveImageRecord(
      outfitId,
      secureUrl, // storage_path is now the full Cloudinary secure_url
      imageType,
      sortOrder
    );

    if (dbError || !imageId) {
      setUploading((prev) =>
        prev.map((u, i) =>
          i === uploadingIndex
            ? {
              ...u,
              error: dbError ?? "Failed to save image record.",
              progress: 0,
            }
            : u
        )
      );
      return;
    }

    const newPhoto: DraftPhoto = {
      preview: secureUrl, // CDN URL — renders immediately
      storagePath: secureUrl,
      imageId,
      imageType,
      sortOrder,
    };

    setPhotos((prev) => {
      const updated = [...prev, newPhoto];
      persistDraft(updated, primaryIndex);
      return updated;
    });

    setUploading((prev) =>
      prev.map((u, i) => (i === uploadingIndex ? { ...u, progress: 100 } : u))
    );
  }

  async function processFiles(files: File[]) {
    setGlobalError(null);
    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = files.slice(0, remaining);

    if (toProcess.length < files.length) {
      setGlobalError(
        `Max ${MAX_PHOTOS} photos allowed. Only the first ${remaining} were added.`
      );
    }

    const valid: File[] = [];
    const invalid: string[] = [];

    for (const file of toProcess) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        invalid.push(`"${file.name}" — unsupported format`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        invalid.push(`"${file.name}" — exceeds ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }
      valid.push(file);
    }

    if (invalid.length > 0) {
      setGlobalError(`Skipped: ${invalid.join(", ")}`);
    }

    if (valid.length === 0) return;

    const currentUploadingCount = uploading.length;
    const newUploading: UploadingPhoto[] = valid.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      error: null,
    }));

    setUploading((prev) => [...prev, ...newUploading]);

    await Promise.all(
      valid.map((file, i) => uploadFile(file, currentUploadingCount + i))
    );

    // Remove completed uploading entries (keep only failed ones to show errors)
    setUploading((prev) => prev.filter((u) => u.error !== null));
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    processFiles(files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }

  async function removePhoto(photo: DraftPhoto) {
    if (!outfitId) return;

    // Server action deletes from DB + Cloudinary
    if (photo.imageId) {
      await deleteImageRecord(photo.imageId, outfitId);
    }

    setPhotos((prev) => {
      const updated = prev.filter((p) => p !== photo);
      const newPrimary = Math.min(primaryIndex, Math.max(0, updated.length - 1));
      setPrimaryIndex(newPrimary);
      persistDraft(updated, newPrimary);
      return updated;
    });
  }

  function setPrimary(index: number) {
    setPrimaryIndex(index);
    persistDraft(photos, index);
  }

  function handleContinue() {
    if (photos.length < MIN_PHOTOS) {
      setGlobalError("Please upload at least one photo before continuing.");
      return;
    }
    setIsContinuing(true);
    const draft = loadDraft();
    saveDraft({ ...draft, stepSaved: Math.max(draft.stepSaved, 3) });
    router.push("/list-your-outfit/pricing");
  }

  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <div className="space-y-6">
      {globalError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>{globalError}</p>
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          ref={dropRef}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer ${isDragging
              ? "border-rose-400 bg-rose-50"
              : "border-stone-200 bg-stone-50/60 hover:border-rose-300 hover:bg-rose-50/40"
            }`}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && fileInputRef.current?.click()
          }
          aria-label="Upload photos"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            onChange={handleFileInput}
            className="sr-only"
            id="photo-upload-input"
          />
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <ImagePlus size={24} />
          </div>
          <p className="text-sm font-semibold text-stone-800">
            Drop photos here or click to browse
          </p>
          <p className="mt-1 text-xs text-stone-500">
            JPG, PNG, WebP — up to {MAX_FILE_SIZE_MB}MB each — max{" "}
            {MAX_PHOTOS} photos
          </p>
          <p className="mt-1 text-xs font-medium text-rose-700">
            {photos.length}/{MAX_PHOTOS} uploaded
          </p>
        </div>
      )}

      {/* Uploading queue */}
      {uploading
        .filter((u) => u.error !== null || u.progress < 100)
        .map((u, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${u.error
                ? "border-red-200 bg-red-50"
                : "border-stone-200 bg-stone-50"
              }`}
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-200">
              <Image
                src={u.preview}
                alt="uploading"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-stone-700">
                {u.file.name}
              </p>
              {u.error ? (
                <p className="mt-0.5 text-xs text-red-600">{u.error}</p>
              ) : (
                <div className="mt-1 h-1.5 w-full rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-rose-600 transition-all duration-300"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
            </div>
            {u.error === null && u.progress < 100 && (
              <Loader2
                size={16}
                className="animate-spin text-rose-600 shrink-0"
              />
            )}
          </div>
        ))}

      {/* Uploaded photos grid */}
      {photos.length > 0 && (
        <div className="rounded-2xl border border-rose-100 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h2 className="font-semibold text-stone-900 text-sm">
              Uploaded Photos
              <span className="ml-2 text-xs font-normal text-stone-400">
                ({photos.length} of {MAX_PHOTOS})
              </span>
            </h2>
            <p className="text-[11px] text-stone-400">
              ★ = primary (shown first to customers)
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo, idx) => (
              <div
                key={photo.imageId ?? idx}
                className="group relative rounded-xl overflow-hidden border-2 aspect-[3/4] bg-stone-100 transition-all"
                style={{
                  borderColor:
                    idx === primaryIndex ? "rgb(190 18 60)" : "transparent",
                }}
              >
                <Image
                  src={photo.preview}
                  alt={`Photo ${idx + 1}`}
                  fill
                  className="object-cover object-top"
                  unoptimized={photo.preview.startsWith("blob:")}
                />

                {/* Primary badge */}
                {idx === primaryIndex && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-rose-700 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    <Star size={9} className="fill-white" />
                    Primary
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-0 flex flex-col items-end justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removePhoto(photo)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700 active:scale-95 transition-all"
                    aria-label="Remove photo"
                  >
                    <X size={13} strokeWidth={3} />
                  </button>

                  {/* Set as primary */}
                  {idx !== primaryIndex && (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      className="flex h-7 items-center gap-1 rounded-full bg-white/90 px-2 text-[10px] font-semibold text-stone-700 shadow hover:bg-white active:scale-95 transition-all"
                      aria-label="Set as primary"
                    >
                      <StarOff size={11} />
                      Primary
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add more tile */}
            {canAddMore && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-200 aspect-[3/4] text-stone-400 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/40 transition-all"
                aria-label="Add more photos"
              >
                <Upload size={18} />
                <span className="mt-1 text-[10px] font-semibold">Add more</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Continue */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-stone-500">
          {photos.length === 0
            ? "At least 1 photo is required."
            : `${photos.length} photo${photos.length !== 1 ? "s" : ""} ready.`}
        </p>
        <button
          type="button"
          onClick={handleContinue}
          disabled={isContinuing || photos.length < MIN_PHOTOS}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-rose-800 hover:to-rose-950 hover:shadow-md disabled:opacity-60 active:scale-[0.98]"
        >
          {isContinuing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ChevronRight size={16} />
          )}
          {isContinuing ? "Continuing…" : "Continue to Pricing"}
        </button>
      </div>
    </div>
  );
}
