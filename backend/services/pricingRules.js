// Pricing rules service: computes premium retail prices with .99 rounding and category floors

const DEFAULT_MULTIPLIER = Number(process.env.PRICE_MULTIPLIER || 2.8);

// Floors in USD for the “premium vibe”
const CATEGORY_FLOORS_USD = {
	'Unisex tee': 40,
	'Heavyweight tee': 42,
	"Women’s fitted tee": 40,
	"Women’s crop tee": 38,
	'Long-sleeve tee': 48,
	'Tank top (unisex)': 36,
	"Women’s racerback tank": 36,
	'Crewneck sweatshirt': 55,
	'Hoodie (fleece pullover)': 60,
	'Premium/thick hoodie': 68,
	'Zip hoodie': 65,
	'Baby bodysuit': 28,
	'Kids tee': 32,
	'Youth hoodie': 50,
	'Dad hat': 35,
	'Beanie': 32,
	'Snapback': 38,
	'Tote bag': 30,
	'11oz mug': 22,
	'15oz mug': 24,
	'Phone case': 28,
	'Sticker (per piece)': 6,
	'Poster 12×16': 28,
};

function usdToCents(usd) {
	return Math.round(Number(usd) * 100);
}

function centsToUsdString(cents) {
	return (cents / 100).toFixed(2);
}

// Round to x.99 in cents
function roundTo99(cents) {
	if (!Number.isFinite(cents)) return 0;
	const dollars = Math.floor(cents / 100);
	return dollars * 100 + 99; // e.g., $40.99
}

function getCategoryFloorCents(categoryLabel) {
	const floorUsd = CATEGORY_FLOORS_USD[categoryLabel];
	if (!floorUsd) return 0;
	return usdToCents(floorUsd);
}

// Compute retail price from an estimated cost (in cents) and a category label
function computePriceCents(costCents, categoryLabel, multiplier = DEFAULT_MULTIPLIER) {
	const categoryFloor = getCategoryFloorCents(categoryLabel);
	const multiplied = Math.round((Number(costCents) || 0) * Number(multiplier));
	const base = Math.max(multiplied, categoryFloor);
	return roundTo99(base);
}

function formatPriceUSD(cents) {
	return centsToUsdString(cents);
}

module.exports = {
	computePriceCents,
	formatPriceUSD,
	getCategoryFloorCents,
	roundTo99,
};

