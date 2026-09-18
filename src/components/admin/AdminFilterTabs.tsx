"use client";

interface Tab {
  value: string;
  label: string;
  count?: number;
}

export function AdminFilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              isActive
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  isActive
                    ? "bg-white/20 dark:bg-stone-900/30 text-white dark:text-stone-900"
                    : "bg-stone-300/70 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>

        );
      })}
    </div>
  );
}
