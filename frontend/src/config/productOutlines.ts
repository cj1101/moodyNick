/**
 * Product Outline Mapping Configuration
 *
 * Maps Printful product IDs to local product outline images.
 * These outlines provide clean, model-free product silhouettes for the design canvas.
 *
 * Image Requirements:
 * - Format: PNG with transparent background
 * - Style: Simple outline or silhouette
 * - View: Front-facing product view
 * - Location: /frontend/public/product-outlines/
 *
 * Adding New Products:
 * 1. Create or source a product outline image (PNG, transparent background)
 * 2. Save it to /frontend/public/product-outlines/
 * 3. Add mapping entry below with Printful product ID as key
 * 4. Test on design page to ensure proper alignment with print area
 */

import { config as apiConfig } from '@/config/api';

export interface ProductOutlineConfig {
  /** Path to the outline image (relative to /public) */
  imagePath: string;
  /** Product category for grouping */
  category: 'apparel' | 'accessories' | 'home-living' | 'stationery';
  /** Whether this product supports color tinting */
  supportsColorTint?: boolean;
  /** Optional scale adjustment factor (default: 1.0) */
  scaleFactor?: number;
  /** Optional vertical offset in pixels (default: 0) */
  offsetY?: number;
  /** Optional horizontal offset in pixels (default: 0) */
  offsetX?: number;
}
/**
 * Product outline mapping
 * Key: Printful product ID (as string)
 * Value: ProductOutlineConfig
 */
const legacyOutlineOverrides: Record<string, Partial<ProductOutlineConfig>> = {
  '71': { category: 'apparel', supportsColorTint: true, scaleFactor: 0.85 },
  '19': { category: 'apparel', supportsColorTint: true, scaleFactor: 0.85 },
  '380': { category: 'apparel', supportsColorTint: true, scaleFactor: 0.85 },
  '146': { category: 'apparel', supportsColorTint: true, scaleFactor: 0.9 },
  '387': { category: 'apparel', supportsColorTint: true, scaleFactor: 0.9 },
  '679': { category: 'apparel', supportsColorTint: true, scaleFactor: 0.85 },
  '163': { category: 'accessories', supportsColorTint: true, scaleFactor: 0.7 },
  '327': { category: 'accessories', supportsColorTint: true, scaleFactor: 0.75 },
  '45': { category: 'accessories', supportsColorTint: false, scaleFactor: 0.4 },
  '46': { category: 'accessories', supportsColorTint: false, scaleFactor: 0.4 },
  '20': { category: 'home-living', supportsColorTint: false, scaleFactor: 0.5 },
  '21': { category: 'home-living', supportsColorTint: false, scaleFactor: 0.5 },
  '1': { category: 'stationery', supportsColorTint: false, scaleFactor: 0.8 },
  '2': { category: 'stationery', supportsColorTint: false, scaleFactor: 0.85 },
};

export interface OutlineStatusResponse {
  summary: {
    totalProducts: number;
    generatedCount: number;
    staticCount: number;
    missingCount: number;
  };
  products: Array<{
    productId: string;
    source: 'predefined' | 'dynamic';
    status: 'generated' | 'static' | 'missing';
    filename: string;
    prompt: string;
    relativePath: string | null;
    absoluteUrl: string | null;
    generated: { exists: boolean; path: string | null };
    static: { exists: boolean; path: string | null };
  }>;
  generatedProductIds: string[];
  staticProductIds: string[];
  missingProductIds: string[];
}

export interface OutlineStatusOptions {
  forceRefresh?: boolean;
}

let cachedOutlineMap: Record<string, ProductOutlineConfig> | null = null;
let cachedStatus: OutlineStatusResponse | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchOutlineStatus(): Promise<OutlineStatusResponse> {
  const response = await fetch(`${apiConfig.apiUrl}/api/outlines/status`, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load outline status (${response.status})`);
  }

  return (await response.json()) as OutlineStatusResponse;
}

function inferCategory(entry: OutlineStatusResponse['products'][number]): ProductOutlineConfig['category'] {
  const override = legacyOutlineOverrides[entry.productId];
  if (override?.category) {
    return override.category;
  }

  const text = `${entry.prompt || ''} ${entry.filename || ''}`.toLowerCase();
  if (/(mug|cup|tumbler)/.test(text)) {
    return 'home-living';
  }
  if (/(poster|print|canvas|framed)/.test(text)) {
    return 'stationery';
  }
  if (/(bag|tote|backpack|duffel)/.test(text)) {
    return 'accessories';
  }
  if (/(case|iphone|samsung|phone)/.test(text)) {
    return 'accessories';
  }
  return 'apparel';
}

function mapStatusToConfig(entry: OutlineStatusResponse['products'][number]): ProductOutlineConfig {
  const imagePath = entry.relativePath || `/api/outlines/${entry.productId}`;
  const override = legacyOutlineOverrides[entry.productId] || {};

  const base: ProductOutlineConfig = {
    imagePath,
    category: override.category || inferCategory(entry),
  };

  return {
    ...base,
    ...override,
    imagePath,
  };
}

function mergeStatusIntoConfig(status: OutlineStatusResponse): Record<string, ProductOutlineConfig> {
  const map: Record<string, ProductOutlineConfig> = {};
  status.products.forEach((entry) => {
    if (entry.status === 'missing') {
      return;
    }
    map[entry.productId] = mapStatusToConfig(entry);
  });
  return map;
}

export async function loadProductOutlineMap(options: OutlineStatusOptions = {}): Promise<Record<string, ProductOutlineConfig>> {
  const now = Date.now();
  const shouldRefresh =
    options.forceRefresh ||
    !cachedOutlineMap ||
    !cachedStatus ||
    now - lastFetchedAt > CACHE_TTL_MS;

  if (!shouldRefresh && cachedOutlineMap) {
    return cachedOutlineMap;
  }

  const status = await fetchOutlineStatus();
  cachedStatus = status;
  cachedOutlineMap = mergeStatusIntoConfig(status);
  lastFetchedAt = now;
  return cachedOutlineMap;
}

export async function getProductOutline(productId: string | number, options?: OutlineStatusOptions): Promise<ProductOutlineConfig | null> {
  const map = await loadProductOutlineMap(options);
  return map[String(productId)] || null;
}
export async function hasProductOutline(productId: string | number, options?: OutlineStatusOptions): Promise<boolean> {
  const map = await loadProductOutlineMap(options);
  return String(productId) in map;
}

/**
 * Retrieves a list of product IDs that have available outlines.
 * @param options - Optional configuration options
 * @returns Promise resolving to an array of product IDs with available outlines
 */
export async function getAvailableOutlineProductIds(options?: OutlineStatusOptions): Promise<string[]> {
  const map = await loadProductOutlineMap(options);
  return Object.keys(map);
}

export async function getProductsByCategory(
  category: 'apparel' | 'accessories' | 'home-living' | 'stationery',
  options?: OutlineStatusOptions,
): Promise<Record<string, ProductOutlineConfig>> {
  const map = await loadProductOutlineMap(options);
  return Object.entries(map)
    .filter(([_, config]) => config.category === category)
    .reduce((acc, [id, config]) => {
      acc[id] = config;
      return acc;
    }, {} as Record<string, ProductOutlineConfig>);
}

/**
 * Generates a CSS filter string for color tinting a product outline.
 * @param hexColor - Hex color code (e.g., "#FF0000")
 * @returns CSS filter string for color tinting
 */
export function getColorTintFilter(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const brightness = (r + g + b) / 3 / 255;

  return `brightness(${brightness}) saturate(1.2)`;
}

export default {
  loadProductOutlineMap,
  getProductOutline,
  hasProductOutline,
  getAvailableOutlineProductIds,
  getProductsByCategory,
  getColorTintFilter,
};
