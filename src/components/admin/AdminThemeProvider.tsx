"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";

export type AdminTheme = "light" | "dark" | "system";
export type ResolvedAdminTheme = "light" | "dark";

interface AdminThemeContextType {
  theme: AdminTheme;
  resolvedTheme: ResolvedAdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(
  undefined
);

const STORAGE_KEY = "shaadi_admin_theme";

/**
 * Temporarily disables all CSS transitions during theme switching
 * to ensure 0ms instantaneous repaint without color fading lag.
 */
function disableTransitionsTemporarily() {
  if (typeof document === "undefined") return () => {};

  const css = document.createElement("style");
  css.setAttribute("type", "text/css");
  css.appendChild(
    document.createTextNode(
      `*, *::before, *::after {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        -ms-transition: none !important;
        transition: none !important;
      }`
    )
  );
  document.head.appendChild(css);

  return () => {
    // Force DOM reflow to flush styles immediately
    (() => window.getComputedStyle(document.body))();

    // Re-enable normal UI transitions (hover states, animations) on the next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          if (css.parentNode) {
            document.head.removeChild(css);
          }
        } catch {
          // ignore
        }
      });
    });
  };
}

export function AdminThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<AdminTheme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedAdminTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Apply theme to DOM synchronously with 0ms transition delay
  const applyTheme = useCallback((targetTheme: AdminTheme) => {
    let resolved: ResolvedAdminTheme = "light";

    if (targetTheme === "system") {
      const systemPrefersDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      resolved = systemPrefersDark ? "dark" : "light";
    } else {
      resolved = targetTheme;
    }

    if (typeof document !== "undefined") {
      const enable = disableTransitionsTemporarily();
      const root = document.documentElement;
      if (resolved === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      enable();
    }

    setResolvedTheme(resolved);
  }, []);

  // Initialize theme from localStorage on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AdminTheme | null;
      if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
        setThemeState(saved);
        applyTheme(saved);
      } else {
        // Default to system or light
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initial = prefersDark ? "dark" : "light";
        setThemeState(initial);
        applyTheme(initial);
      }
    } catch {
      applyTheme("light");
    }
    setMounted(true);
  }, [applyTheme]);

  // Listen for system color-scheme changes if theme is "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  const setTheme = useCallback(
    (newTheme: AdminTheme) => {
      // 1. Immediately apply DOM update synchronously for 0ms visual change
      applyTheme(newTheme);
      // 2. Update React state
      setThemeState(newTheme);
      // 3. Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // Ignore storage errors
      }
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    // Read directly from DOM classList to guarantee zero closure latency
    const isCurrentlyDark =
      typeof document !== "undefined"
        ? document.documentElement.classList.contains("dark")
        : resolvedTheme === "dark";
    const next: AdminTheme = isCurrentlyDark ? "light" : "dark";
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  // Global keyboard shortcut: Ctrl+Shift+D to toggle theme
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        toggleTheme();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  // Clean up dark class on document when unmounting admin layout
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("dark");
      }
    };
  }, []);

  return (
    <AdminThemeContext.Provider
      value={{
        theme,
        resolvedTheme: mounted ? resolvedTheme : "light",
        setTheme,
        toggleTheme,
      }}
    >
      <div className={resolvedTheme === "dark" ? "dark" : ""}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within an AdminThemeProvider");
  }
  return context;
}

/**
 * Interactive Admin Theme Toggle button
 * Supports icon button mode, compact badge mode, or dropdown switcher.
 */
export function AdminThemeToggle({
  variant = "button",
  className = "",
}: {
  variant?: "button" | "menu" | "pill";
  className?: string;
}) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useAdminTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isDark = resolvedTheme === "dark";

  if (variant === "pill") {
    return (
      <div
        className={`inline-flex items-center rounded-xl p-1 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 ${className}`}
        role="group"
        aria-label="Theme mode switcher"
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            theme === "light"
              ? "bg-white dark:bg-stone-700 text-stone-950 dark:text-white shadow-2xs"
              : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          }`}
        >
          <Sun size={13} className="text-amber-500" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            theme === "dark"
              ? "bg-stone-900 dark:bg-stone-700 text-white shadow-2xs"
              : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          }`}
        >
          <Moon size={13} className="text-rose-400" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
            theme === "system"
              ? "bg-white dark:bg-stone-700 text-stone-950 dark:text-white shadow-2xs"
              : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          }`}
        >
          <Monitor size={13} className="text-stone-500" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={toggleTheme}
        className={`group relative flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-700 shadow-2xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${className}`}
        title={isDark ? "Switch to Light Theme (Ctrl+Shift+D)" : "Switch to Dark Theme (Ctrl+Shift+D)"}
        aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      >
        {isDark ? (
          <Sun
            size={17}
            className="text-amber-400 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110"
          />
        ) : (
          <Moon
            size={17}
            className="text-stone-600 group-hover:text-rose-600 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
          />
        )}
      </button>
    </div>
  );
}
