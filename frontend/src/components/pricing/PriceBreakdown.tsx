"use client";

import React, { useEffect, useRef } from "react";
import { usePricing } from "@/state/pricing/pricingStore";

const PriceBreakdown: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { breakdown } = usePricing();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Price breakdown"
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl p-6 z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Price breakdown</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
          {breakdown.lines.map((line, idx) => (
            <div key={idx} className="flex items-start justify-between text-sm">
              <div className="text-gray-700">
                {line.label}
                {line.note ? <span className="ml-2 text-gray-400">({line.note})</span> : null}
              </div>
              <div className={`font-medium ${line.amount < 0 ? "text-green-700" : "text-gray-900"}`}>
                {line.amount < 0 ? "-" : ""}
                {breakdown.currency} {Math.abs(line.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <hr className="my-4" />
        <div className="flex items-center justify-between text-base font-semibold">
          <span>{breakdown.isEstimate ? "Estimated total" : "Total"}</span>
          <span className="text-purple-700">{breakdown.currency} {breakdown.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;


