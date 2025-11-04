/**
 * API Configuration
 * 
 * This file manages API URLs for different environments.
 * 
 * For local development:
 * - Uses http://localhost:5000 by default
 * 
 * For production:
 * - Set NEXT_PUBLIC_API_BASE_URL in your hosting environment
 * - Defaults to https://api.moodyart.shop for production
 */

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://api.moodyart.shop' : 'http://localhost:5000');

export const config = {
  apiUrl: API_URL,
  endpoints: {
    base: API_URL,
    // Auth
    register: `${API_URL}/api/auth/register`,
    login: `${API_URL}/api/auth/login`,
    me: `${API_URL}/api/auth/me`,
    
    // Catalog
    products: `${API_URL}/api/catalog/products`,
    artwork: `${API_URL}/api/catalog/artwork`,
    uploadArtwork: `${API_URL}/api/catalog/artwork/upload`,
    storeProducts: `${API_URL}/api/catalog/store-products`,
    storeProductDetails: `${API_URL}/api/catalog/store-products`,
    
    // Designs
    designs: `${API_URL}/api/designs`,

    // Mockups
    generateMockup: `${API_URL}/api/mockups/generate`,

    // Outlines
    outlines: `${API_URL}/api/outlines`,

    // Orders (Stripe removed)
    createOrder: `${API_URL}/api/orders/create-order`,
    orders: `${API_URL}/api/orders`,
  },
};

export default config;
