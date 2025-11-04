export interface ShippingTaxParams {
  countryCode?: string;
  stateCode?: string;
  zip?: string;
  items: Array<{ quantity: number; weightGrams?: number; price: number }>;
}

export interface ShippingTaxResult {
  shippingAmount: number; // estimate or final
  taxAmount: number; // estimate or final
}

// Placeholder estimators. Replace with backend calls to Printful/shipping provider as available.
export async function estimateShippingAndTax(params: ShippingTaxParams): Promise<ShippingTaxResult> {
  const quantity = params.items.reduce((acc, it) => acc + Math.max(0, it.quantity || 0), 0);
  const baseShip = 4.5;
  const perItem = 1.25;
  const shippingAmount = Math.max(0, baseShip + Math.max(0, quantity - 1) * perItem);

  const itemsSubtotal = params.items.reduce((acc, it) => acc + (it.price || 0) * Math.max(0, it.quantity || 0), 0);
  const taxRate = inferTaxRate(params.countryCode, params.stateCode);
  const taxAmount = round2(itemsSubtotal * taxRate);

  return { shippingAmount: round2(shippingAmount), taxAmount };
}

function inferTaxRate(country?: string, state?: string): number {
  if (country === "US") {
    if (state === "CA" || state === "NY" || state === "WA") return 0.09;
    return 0.07;
  }
  if (country === "GB" || country === "DE" || country === "FR") return 0.20;
  return 0.1;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}


