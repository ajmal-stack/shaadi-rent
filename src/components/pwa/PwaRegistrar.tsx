"use client";

import { useEffect, useState } from "react";
import { Download, X, Share2, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaRegistrar() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("ShaadiRent PWA Service Worker registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("Service Worker registration failed:", err);
          });
      });
    }

    // 2. Check if already installed as standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return; // Already installed, do not show banner
    }

    // Check if dismissed recently
    const dismissedUntil = localStorage.getItem("shaadi_pwa_dismissed");
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return;
    }

    // 3. Android / Chrome install prompt capture
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Wait 3 seconds after page load before displaying prompt
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIosDevice && isSafari) {
      setIsIos(true);
      setTimeout(() => setShowBanner(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!installPrompt) return;

    await installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setShowBanner(false);
    }
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIosGuide(false);
    // Dismiss for 7 days
    localStorage.setItem(
      "shaadi_pwa_dismissed",
      String(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Floating Bottom App Install Prompt */}
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center justify-between gap-3.5 rounded-2xl border border-rose-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 p-3.5 shadow-xl backdrop-blur-md">
          {/* App Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-700 via-rose-800 to-rose-950 shadow-md ring-1 ring-amber-400/40">
            <span className="text-xl select-none">💍</span>
          </div>

          {/* Text Information */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                ShaadiRent App
              </h4>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 text-[9px] font-bold uppercase text-rose-800 dark:text-rose-300">
                <Sparkles size={9} /> Free
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              Faster booking & bridal outfit alerts
            </p>
          </div>

          {/* Install & Dismiss Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-800 hover:bg-rose-900 dark:bg-amber-600 dark:hover:bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
            >
              <Download size={13} />
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              aria-label="Dismiss app prompt"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Step-by-Step Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-800 text-white text-lg">
                  💍
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Install on iPhone / iPad
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Add ShaadiRent to your Home Screen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-stone-600 dark:text-stone-300">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-xs">
                  1
                </span>
                <span className="flex-1">
                  Tap the <strong>Share button</strong>{" "}
                  <Share2 size={13} className="inline mx-1 text-sky-600" /> at the bottom of Safari.
                </span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-xs">
                  2
                </span>
                <span className="flex-1">
                  Scroll down and tap <strong>Add to Home Screen ⊞</strong>.
                </span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-xs">
                  3
                </span>
                <span className="flex-1">
                  Tap <strong>Add</strong> in the top-right corner.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full rounded-xl bg-stone-900 dark:bg-amber-600 py-2.5 text-xs font-bold text-white transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
