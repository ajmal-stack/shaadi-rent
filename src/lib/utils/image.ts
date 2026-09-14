/**
 * Resolves an outfit image URL from a storage_path value.
 *
 * storage_path is now always one of:
 *   - A full Cloudinary URL  (https://res.cloudinary.com/...)
 *   - A full https URL       (legacy Supabase or other)
 *   - A local public path    (/images/...)
 *   - null / empty           → returns fallback
 */
export function getOutfitImageUrl(
  storagePath?: string | null,
  fallbackImage: string = "/images/bridal_lehenga.jpg"
): string {
  if (!storagePath || typeof storagePath !== "string") {
    return fallbackImage;
  }

  const trimmed = storagePath.trim();
  if (!trimmed) {
    return fallbackImage;
  }

  // Full URL (Cloudinary, Supabase legacy, etc.) or local public path
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // Legacy: bare Supabase storage path without a prefix — construct URL as before
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (supabaseUrl) {
    const normalizedPath = trimmed.startsWith("outfit-images/")
      ? trimmed
      : `outfit-images/${trimmed}`;
    return `${supabaseUrl}/storage/v1/object/public/${normalizedPath}`;
  }

  return fallbackImage;
}

/**
 * Extracts the Cloudinary public_id from a secure_url.
 *
 * Example input:  https://res.cloudinary.com/mycloud/image/upload/v1234567890/shaadi-rent/outfits/abc123.jpg
 * Example output: shaadi-rent/outfits/abc123
 *
 * Returns null if the URL is not a valid Cloudinary URL.
 */
export function extractCloudinaryPublicId(secureUrl: string): string | null {
  try {
    const url = new URL(secureUrl);
    if (!url.hostname.includes("cloudinary.com")) return null;

    // Path: /cloud_name/image/upload/v<version>/<public_id>.<ext>
    // or:   /cloud_name/image/upload/<public_id>.<ext>
    const parts = url.pathname.split("/");
    // Find the index after "upload"
    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx === -1) return null;

    // Skip version segment if present (starts with "v" followed by digits)
    let startIdx = uploadIdx + 1;
    if (/^v\d+$/.test(parts[startIdx])) {
      startIdx++;
    }

    const pathWithExt = parts.slice(startIdx).join("/");
    // Strip file extension
    const publicId = pathWithExt.replace(/\.[^/.]+$/, "");
    return publicId || null;
  } catch {
    return null;
  }
}
