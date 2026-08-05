"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroPromoTermsPopoverProps = {
  terms: string[];
  accent: string;
  isDark?: boolean;
  triggerLabel?: string;
  children: ReactNode;
};

export function HeroPromoTermsPopover({
  terms,
  accent,
  isDark = false,
  triggerLabel = "Условия акции",
  children,
}: HeroPromoTermsPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (!terms.length) return <>{children}</>;

  return (
    <div className="relative inline-flex max-w-full">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex max-w-full items-center gap-1.5 rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ outlineColor: accent }}
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-haspopup="dialog"
        aria-label={triggerLabel}
        onClick={() => setOpen((v) => !v)}
      >
        {children}
        <Info className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={titleId}
          role="dialog"
          aria-label={triggerLabel}
          className={cn(
            "absolute left-0 top-[calc(100%+8px)] z-50 w-[min(100vw-2rem,20rem)] rounded-xl border p-3 text-left shadow-xl",
            isDark
              ? "border-white/15 bg-[#121412] text-white/90"
              : "border-gray-200 bg-white text-gray-800",
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-xs font-semibold" style={{ color: accent }}>
              {triggerLabel}
            </p>
            <button
              type="button"
              className={cn(
                "rounded-md p-0.5 focus-visible:outline-none focus-visible:ring-2",
                isDark ? "text-white/60 hover:text-white" : "text-gray-400 hover:text-gray-700",
              )}
              aria-label="Закрыть"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="space-y-1.5 text-[11px] leading-snug">
            {terms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
