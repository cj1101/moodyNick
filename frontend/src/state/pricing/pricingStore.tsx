"use client";

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { calculatePrice, PriceCalculationInput, PriceBreakdown } from "@/lib/pricing/calculatePrice";
import { config } from "@/config/api";

export interface PricingContextState {
  inputs: PriceCalculationInput;
  breakdown: PriceBreakdown;
  setInputs: (updater: (prev: PriceCalculationInput) => PriceCalculationInput) => void;
  setEstimateShippingAndTax: (shipping: number, tax: number) => void;
  // Optional: design pages can register a Continue handler (e.g., generate mockups then show actions)
  onContinue?: () => Promise<void> | void;
  setContinueHandler: (fn: (() => Promise<void> | void) | undefined) => void;
}

const defaultInputs: PriceCalculationInput = {
  currency: "USD",
  basePrice: 0,
  quantity: 1,
  extraPlacements: 0,
  hasInsideLabel: false,
  hasOutsideLabel: false,
  isPremiumImage: false,
  isEmbroidery: false,
  embroideryDigitizationFeeApplicable: false,
  membershipDiscountRate: 0,
  shipping: { isEstimated: true, amount: 0 },
  tax: { isEstimated: true, amount: 0 }
};

const PricingContext = createContext<PricingContextState | null>(null);

export const PricingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inputs, setInputsState] = useState<PriceCalculationInput>(defaultInputs);
  const [onContinue, setOnContinue] = useState<(() => Promise<void> | void) | undefined>(undefined);
  const [breakdown, setBreakdown] = useState<PriceBreakdown>(() => calculatePrice(defaultInputs));

  // Sync pricing with backend source of truth; fallback to local calculator on failure
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/api/pricing/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputs),
          signal: controller.signal
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as PriceBreakdown;
        if (!cancelled) setBreakdown(data);
      } catch {
        // Fallback to local computation if backend unavailable
        if (!cancelled) setBreakdown(calculatePrice(inputs));
      }
    };
    run();
    return () => { cancelled = true; controller.abort(); };
  }, [inputs]);

  const setInputs = useCallback((updater: (prev: PriceCalculationInput) => PriceCalculationInput) => {
    setInputsState(prev => updater(prev));
  }, []);

  const setEstimateShippingAndTax = useCallback((shippingAmount: number, taxAmount: number) => {
    setInputsState(prev => ({
      ...prev,
      shipping: { isEstimated: true, amount: Math.max(0, shippingAmount) },
      tax: { isEstimated: true, amount: Math.max(0, taxAmount) }
    }));
  }, []);

  // Stable setter prevents effects depending on setContinueHandler from re-running unnecessarily
  const setContinueHandlerCb = useCallback((fn: (() => Promise<void> | void) | undefined) => {
    setOnContinue(() => fn);
  }, []);

  // Memoize value to keep reference stable across renders
  const value: PricingContextState = useMemo(() => ({
    inputs,
    breakdown,
    setInputs,
    setEstimateShippingAndTax,
    onContinue,
    setContinueHandler: setContinueHandlerCb
  }), [inputs, breakdown, setInputs, setEstimateShippingAndTax, onContinue, setContinueHandlerCb]);

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
};

export function usePricing() {
  const ctx = useContext(PricingContext);
  if (!ctx) {
    throw new Error("usePricing must be used within a PricingProvider");
  }
  return ctx;
}


