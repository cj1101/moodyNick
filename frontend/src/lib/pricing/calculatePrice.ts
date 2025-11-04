export interface PriceCalculationInput {
  currency: string;
  basePrice: number; // price for blank + 1 placement (from variant)
  quantity: number;
  extraPlacements: number; // placements beyond the first
  hasInsideLabel: boolean;
  hasOutsideLabel: boolean;
  isPremiumImage: boolean;
  isEmbroidery: boolean;
  embroideryDigitizationFeeApplicable: boolean; // one-time per design
  membershipDiscountRate: number; // 0..1 applied to eligible costs
  shipping: { isEstimated: boolean; amount: number };
  tax: { isEstimated: boolean; amount: number };
}

export interface PriceBreakdownLine {
  label: string;
  amount: number;
  note?: string;
}

export interface PriceBreakdown {
  currency: string;
  lines: PriceBreakdownLine[];
  subtotal: number;
  discounts: number;
  shipping: number;
  tax: number;
  total: number;
  isEstimate: boolean;
}

// Heuristic fee table — tune with real data when available
const FEES = {
  extraPlacement: 3.0,
  insideLabel: 2.0,
  outsideLabel: 2.0,
  premiumImage: 1.0,
  embroideryDigitization: 6.0
};

export function calculatePrice(input: PriceCalculationInput): PriceBreakdown {
  const currency = input.currency || "USD";
  const qty = Math.max(1, input.quantity || 1);

  const base = (input.basePrice || 0) * qty;

  const customizationFeesPerItem =
    (input.extraPlacements > 0 ? FEES.extraPlacement * input.extraPlacements : 0) +
    (input.hasInsideLabel ? FEES.insideLabel : 0) +
    (input.hasOutsideLabel ? FEES.outsideLabel : 0) +
    (input.isPremiumImage ? FEES.premiumImage : 0);

  const customizationFees = customizationFeesPerItem * qty;

  const digitization = input.isEmbroidery && input.embroideryDigitizationFeeApplicable
    ? FEES.embroideryDigitization
    : 0;

  const subtotalBeforeDiscount = base + customizationFees + digitization;

  // Membership discount applies to eligible costs (assume base + branding + placements, not shipping/tax)
  const discountRate = Math.min(Math.max(input.membershipDiscountRate || 0, 0), 1);
  const discount = Math.round(subtotalBeforeDiscount * discountRate * 100) / 100;
  const subtotal = subtotalBeforeDiscount - discount;

  const shipping = Math.max(0, input.shipping?.amount || 0);
  const tax = Math.max(0, input.tax?.amount || 0);

  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  const lines: PriceBreakdownLine[] = [
    { label: "Base (incl. 1 placement)", amount: round2(base) },
  ];

  if (customizationFeesPerItem > 0) {
    if (input.extraPlacements > 0) {
      lines.push({ label: `Extra placements ×${input.extraPlacements} (per item)`, amount: round2(FEES.extraPlacement * input.extraPlacements * qty) });
    }
    if (input.hasInsideLabel) lines.push({ label: "Inside label (per item)", amount: round2(FEES.insideLabel * qty) });
    if (input.hasOutsideLabel) lines.push({ label: "Outside label (per item)", amount: round2(FEES.outsideLabel * qty) });
    if (input.isPremiumImage) lines.push({ label: "Premium image (per item)", amount: round2(FEES.premiumImage * qty) });
  }

  if (digitization > 0) {
    lines.push({ label: "Embroidery digitization (one-time)", amount: round2(digitization) });
  }

  if (discount > 0) {
    lines.push({ label: "Membership/volume discount", amount: -round2(discount) });
  }

  if (shipping > 0) {
    lines.push({ label: input.shipping?.isEstimated ? "Shipping (estimated)" : "Shipping", amount: round2(shipping) });
  }

  if (tax > 0) {
    lines.push({ label: input.tax?.isEstimated ? "Tax (estimated)" : "Tax", amount: round2(tax) });
  }

  return {
    currency,
    lines,
    subtotal: round2(subtotal),
    discounts: round2(discount),
    shipping: round2(shipping),
    tax: round2(tax),
    total: round2(total),
    isEstimate: !!(input.shipping?.isEstimated || input.tax?.isEstimated)
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}


