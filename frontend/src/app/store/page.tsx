'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { config } from '@/config/api';

interface StoreProduct {
  id: string;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
  type: string;
}

const StorePage = () => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStoreProducts = async () => {
      try {
        const response = await fetch(config.endpoints.storeProducts);
        if (!response.ok) {
          throw new Error('Failed to fetch store products');
        }
        const data = await response.json();
        
        // Ensure we have an array of products
        if (Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          console.error('Unexpected API response format:', data);
          setProducts([]);
        }
      } catch (err) {
        setError('Failed to load store products. Please make sure the backend is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Pre-Made Products
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Ready-to-ship products from our collection
          </p>
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Pre-Made Products
          </div>
        </div>

        {!Array.isArray(products) || products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Store Products Available</h3>
            <p className="text-gray-600 mb-6">
              We're working on adding pre-made products to our store. Check back soon!
            </p>
            <Link
              href="/shop"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-block"
            >
              Browse Custom Products Instead
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/store/${product.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:scale-105"
              >
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-8">
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-6xl">📦</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      Pre-Made
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.variants} variant{product.variants !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-600 font-semibold">Buy Now</span>
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-xl p-8 shadow-lg">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Pre-Made vs Custom</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm">📦</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Pre-Made Products</h4>
                    <p className="text-gray-600 text-sm">Ready-to-ship items with fixed designs. Quick delivery!</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 text-sm">🎨</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Custom Products</h4>
                    <p className="text-gray-600 text-sm">Design your own with our custom design tool. Personal touch!</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Link
                href="/shop"
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Try Custom Design
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorePage;
