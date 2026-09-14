"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface DocUploaderProps {
  label: string;
  description: string;
  userId: string;
  value: string; // Cloudinary secure_url
  onChange: (url: string) => void;
  required?: boolean;
}

export function DocUploader({
  label,
  description,
  userId,
  value,
  onChange,
  required = false,
}: DocUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Document size must be under 10MB.");
      return;
    }

    // Validate mime type
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(10);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError("Cloudinary is not configured in .env.local.");
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", `shaadi-rent/owner-ids/${userId}`);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 90);
          setProgress(pct);
        }
      });

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as { secure_url: string };
            setProgress(100);
            onChange(data.secure_url);
          } catch {
            setError("Failed to parse Cloudinary response.");
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText) as { error?: { message?: string } };
            setError(errRes.error?.message || "Upload failed. Please try again.");
          } catch {
            setError(`Upload error: Status ${xhr.status}`);
          }
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        setError("Network error while uploading document.");
        setUploading(false);
      };

      xhr.send(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected upload error.");
      setUploading(false);
    }
  }

  function handleRemove() {
    onChange("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
          {label}
          {required && <span className="text-rose-600 font-bold">*</span>}
        </label>
        {value && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle size={12} /> Uploaded
          </span>
        )}
      </div>
      <p className="text-xs text-stone-500">{description}</p>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-50 aspect-[16/10] max-h-56">
          <Image
            src={value}
            alt={label}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 400px"
          />
          <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-xs font-medium text-stone-900 shadow transition-all hover:scale-105"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow transition-all hover:scale-105"
              title="Remove document"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            uploading
              ? "border-amber-400 bg-amber-50/50 cursor-wait"
              : "border-stone-300 bg-stone-50/70 hover:bg-stone-50 hover:border-rose-300"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-amber-600" size={28} />
              <p className="text-xs font-semibold text-stone-700">Uploading to secure vault...</p>
              <div className="w-36 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] text-stone-500">{progress}%</span>
            </div>
          ) : (
            <>
              <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 mb-2">
                <Upload size={18} />
              </div>
              <p className="text-xs font-semibold text-stone-800">
                Click to upload or drag and drop
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                JPG, PNG, or WebP (Max 10MB)
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileSelected}
        className="hidden"
      />
    </div>
  );
}
