"use client";

import React, { useMemo } from "react";
import { calculatePrice } from "@/lib/pricing/calculatePrice";

type Card = { title: string; extraPlacements: number; note?: string };

const EXAMPLE_BASE_PRICE = 40; // fallback when variant base not known on shop

const cards: Card[] = [
  { title: "1 placement (front)", extraPlacements: 0 },
  { title: "2 placements (front + back)", extraPlacements: 1 },
  { title: "3 placements (front + back + sleeve)", extraPlacements: 2 },
  { title: "Sleeve only", extraPlacements: 0, note: "Placement: sleeve" },
];

const PlacementCostExplainer: React.FC<{ base?: number; currency?: string }> = ({ base = EXAMPLE_BASE_PRICE, currency = "USD" }) => {
  const examples = useMemo(() => {
    return cards.map((c) => {
      const breakdown = calculatePrice({
        currency,
        basePrice: base,
        quantity: 1,
        extraPlacements: c.title.includes("Sleeve") ? 0 : c.extraPlacements,
        hasInsideLabel: false,
        hasOutsideLabel: false,
        isPremiumImage: false,
        isEmbroidery: false,
        embroideryDigitizationFeeApplicable: false,
        membershipDiscountRate: 0,
        shipping: { isEstimated: true, amount: 0 },
        tax: { isEstimated: true, amount: 0 },
      });
      return { ...c, total: breakdown.total };
    });
  }, [base, currency]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">Cost by placements (example)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {examples.map((ex, idx) => (
          <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="font-medium text-gray-800 mb-1">{ex.title}</div>
            {ex.note && <div className="text-xs text-gray-500 mb-1">{ex.note}</div>}
            <div className="text-2xl font-bold text-purple-700">{currency} {ex.total.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-2">Shipping and taxes calculated at checkout</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlacementCostExplainer;


