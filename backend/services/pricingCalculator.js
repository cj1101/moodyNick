// Server-side pricing calculation to be the source of truth
// Mirrors frontend implementation at frontend/src/lib/pricing/calculatePrice.ts

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

const FEES = {
  extraPlacement: 3.0,
  insideLabel: 2.0,
  outsideLabel: 2.0,
  premiumImage: 1.0,
  embroideryDigitization: 6.0
};

function coerceBool(v, fallback = false) {
  return typeof v === 'boolean' ? v : fallback;
}

function coerceNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function calculatePrice(inputRaw) {
  const input = Object(inputRaw || {});
  const currency = input.currency || 'USD';
  const qty = Math.max(1, coerceNum(input.quantity, 1));
  const basePrice = coerceNum(input.basePrice, 0);
  const extraPlacements = Math.max(0, coerceNum(input.extraPlacements, 0));
  const hasInsideLabel = coerceBool(input.hasInsideLabel, false);
  const hasOutsideLabel = coerceBool(input.hasOutsideLabel, false);
  const isPremiumImage = coerceBool(input.isPremiumImage, false);
  const isEmbroidery = coerceBool(input.isEmbroidery, false);
  const embroideryDigitizationFeeApplicable = coerceBool(input.embroideryDigitizationFeeApplicable, false);
  const membershipDiscountRate = Math.min(Math.max(coerceNum(input.membershipDiscountRate, 0), 0), 1);
  const shippingAmount = Math.max(0, coerceNum(input?.shipping?.amount, 0));
  const taxAmount = Math.max(0, coerceNum(input?.tax?.amount, 0));
  const shippingIsEstimated = !!input?.shipping?.isEstimated;
  const taxIsEstimated = !!input?.tax?.isEstimated;

  const base = round2(basePrice * qty);

  const customizationFeesPerItem =
    (extraPlacements > 0 ? FEES.extraPlacement * extraPlacements : 0) +
    (hasInsideLabel ? FEES.insideLabel : 0) +
    (hasOutsideLabel ? FEES.outsideLabel : 0) +
    (isPremiumImage ? FEES.premiumImage : 0);

  const customizationFees = round2(customizationFeesPerItem * qty);

  const digitization = isEmbroidery && embroideryDigitizationFeeApplicable
    ? FEES.embroideryDigitization
    : 0;

  const subtotalBeforeDiscount = round2(base + customizationFees + digitization);
  const discount = round2(subtotalBeforeDiscount * membershipDiscountRate);
  const subtotal = round2(subtotalBeforeDiscount - discount);

  const shipping = round2(shippingAmount);
  const tax = round2(taxAmount);
  const total = round2(subtotal + shipping + tax);

  const lines = [{ label: 'Base (incl. 1 placement)', amount: base }];
  if (customizationFeesPerItem > 0) {
    if (extraPlacements > 0) {
      lines.push({ label: `Extra placements ×${extraPlacements} (per item)`, amount: round2(FEES.extraPlacement * extraPlacements * qty) });
    }
    if (hasInsideLabel) lines.push({ label: 'Inside label (per item)', amount: round2(FEES.insideLabel * qty) });
    if (hasOutsideLabel) lines.push({ label: 'Outside label (per item)', amount: round2(FEES.outsideLabel * qty) });
    if (isPremiumImage) lines.push({ label: 'Premium image (per item)', amount: round2(FEES.premiumImage * qty) });
  }
  if (digitization > 0) {
    lines.push({ label: 'Embroidery digitization (one-time)', amount: round2(digitization) });
  }
  if (discount > 0) {
    lines.push({ label: 'Membership/volume discount', amount: -round2(discount) });
  }
  if (shipping > 0) {
    lines.push({ label: shippingIsEstimated ? 'Shipping (estimated)' : 'Shipping', amount: shipping });
  }
  if (tax > 0) {
    lines.push({ label: taxIsEstimated ? 'Tax (estimated)' : 'Tax', amount: tax });
  }

  return {
    currency,
    lines,
    subtotal,
    discounts: discount,
    shipping,
    tax,
    total,
    isEstimate: !!(shippingIsEstimated || taxIsEstimated)
  };
}

module.exports = { calculatePrice };


