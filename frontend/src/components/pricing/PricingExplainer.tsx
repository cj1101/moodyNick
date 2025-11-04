"use client";

import React, { useState } from "react";

const sections = [
  { title: "Base price", content: "Includes the blank product, one print or embroidery placement, and fulfillment." },
  { title: "Extra placements", content: "Adding more print/embroidery placements increases the cost per item." },
  { title: "Labels & branding", content: "Custom inside or outside labels add a small fee per item." },
  { title: "Premium images", content: "Premium image processing can add a small per-item fee." },
  { title: "Embroidery digitization", content: "Embroidery requires a one-time digitization fee per design (not per item)." },
  { title: "Shipping", content: "Shipping is added per order or item based on product and destination." },
  { title: "Taxes", content: "Applicable taxes are charged based on the order destination." },
  { title: "Discounts & plans", content: "You can use Printful free, or get discounts through the Growth Plan or higher sales volumes. Membership discounts can reduce product, branding, and sample costs." },
  { title: "Transparency", content: "All fees are transparent and previewable before finalizing. Set your own retail prices and profit margin confidently." }
];

const PricingExplainer: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-gray-800">How pricing works</h2>
        <button
          className="text-sm text-purple-700 underline underline-offset-4 hover:text-purple-800"
          onClick={() => setShowModal(true)}
        >
          Open details
        </button>
      </div>

      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {sections.map((sec, idx) => (
          <div key={idx}>
            <button
              className="w-full text-left px-4 py-3 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-600"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              aria-expanded={openIdx === idx}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{sec.title}</span>
                <span className="text-gray-500">{openIdx === idx ? "−" : "+"}</span>
              </div>
            </button>
            {openIdx === idx && (
              <div className="px-4 pb-4 text-sm text-gray-700">{sec.content}</div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">How pricing works</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-auto pr-1">
              {sections.map((s, i) => (
                <div key={i}>
                  <div className="font-medium text-gray-800 mb-1">{s.title}</div>
                  <div className="text-sm text-gray-700">{s.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingExplainer;


