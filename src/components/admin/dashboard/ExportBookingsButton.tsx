"use client";

import { useState } from "react";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";

interface ExportBookingsButtonProps {
  currentRange?: string;
}

export function ExportBookingsButton({ currentRange = "30d" }: ExportBookingsButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    try {
      setLoading(true);
      const url = `/api/admin/export/bookings?range=${encodeURIComponent(currentRange)}`;
      const res = await fetch(url);

      if (!res.ok) {
        let errorMsg = `Export failed (${res.status})`;
        try {
          const json = await res.json();
          if (json.details) errorMsg += `: ${json.details}`;
          else if (json.error) errorMsg += `: ${json.error}`;
        } catch {
          const text = await res.text();
          if (text) errorMsg += `: ${text}`;
        }
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = currentRange && currentRange !== "all" 
        ? `shaadirent-bookings-${currentRange}.csv` 
        : "shaadirent-bookings.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      console.error("Failed to export bookings:", err);
      const message = err instanceof Error ? err.message : "Unable to export bookings.";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 shadow-sm hover:border-rose-200 dark:hover:border-rose-800/60 hover:text-rose-900 dark:hover:text-rose-300 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
      title={`Export bookings CSV (${currentRange.toUpperCase()})`}
    >
      {loading ? (
        <>
          <Loader2 size={15} className="animate-spin text-rose-700 dark:text-rose-400" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download size={15} className="text-stone-500 dark:text-stone-400" />
          <span>Export CSV</span>
        </>
      )}
    </button>
  );
}
