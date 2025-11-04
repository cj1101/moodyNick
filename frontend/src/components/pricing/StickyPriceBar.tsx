"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { usePricing } from "@/state/pricing/pricingStore";
import PriceBreakdown from "./PriceBreakdown";

const StickyPriceBar: React.FC = () => {
  const { breakdown, onContinue } = usePricing();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hidden if nothing to show
  const hidden = breakdown.total <= 0;
  if (hidden) return null;

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-50"
        style={{ pointerEvents: "none" }}
        aria-live="polite"
      >
      <div className="mx-auto max-w-7xl px-4 pb-4" style={{ pointerEvents: "auto" }}>
        <div className="bg-white/95 backdrop-blur rounded-t-xl shadow-2xl border border-gray-200 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-sm text-gray-500">
              {breakdown.isEstimate ? "Estimated total" : "Total"}
            </div>
            <div className="text-2xl font-bold text-purple-700 truncate">
              {breakdown.currency} {breakdown.total.toFixed(2)}
            </div>
            <button
              className="text-sm text-purple-700 underline underline-offset-4 hover:text-purple-800 focus:outline-none"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
            >
              View breakdown
            </button>
          </div>

          <div className="ml-auto flex-shrink-0">
            {/^\/design\/[^/]+\/[^/]+$/.test(pathname || "") && (
              <button
                className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-600"
                onClick={async () => {
                  if (onContinue) {
                    await onContinue();
                    return;
                  }
                  if (typeof window !== "undefined") {
                    if (window.location.pathname.startsWith("/cart")) {
                      window.location.href = "/checkout";
                    } else if (window.location.pathname.startsWith("/checkout")) {
                      const el = document.getElementById("checkout-form");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    } else {
                      window.location.href = "/cart";
                    }
                  }
                }}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      {open && (
        <PriceBreakdown open={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
};

export default StickyPriceBar;


