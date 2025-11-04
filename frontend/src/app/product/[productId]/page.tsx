'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { config } from '@/config/api';
import { usePricing } from '@/state/pricing/pricingStore';

interface ProductFile {
  id: number;
  type: string;
  title: string;
  preview_url?: string;
  thumbnail_url?: string;
}

interface Variant {
  id: number;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  main_category_id: number;
  warehouse_product_variant_id: number | null;
  retail_price: string;
  currency: string;
  is_ignored: boolean;
  sku: string | null;
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
  files: ProductFile[];
  options: Array<{
    id: string;
    value: string;
  }>;
}

interface Product {
  sync_product?: {
    id: number;
    external_id: string;
    name: string;
    variants: number;
    synced: number;
    thumbnail_url: string;
    is_ignored: boolean;
  };
  product?: {
    id: number;
    type: string;
    type_name: string;
    title: string;
    brand: string;
    model: string;
    image: string;
    variant_count: number;
    currency: string;
  };
  sync_variants?: Variant[];
  variants?: Variant[];
}

// Helper functions defined outside component to avoid dependency issues
const getUniqueColorsHelper = (variants: Variant[]) => {
  const colors = new Set<string>();
  variants.forEach(variant => {
    // Try to get color from options array first
    if (variant.options && Array.isArray(variant.options)) {
      const colorOpt = variant.options.find(opt => opt.id.toLowerCase().includes('color'));
      if (colorOpt) {
        colors.add(colorOpt.value);
        return;
      }
    }
    
    // Fallback: Parse from variant name (e.g., "A4 N3142 (Black / S)")
    if (variant.name) {
      const match = variant.name.match(/\(([^/]+)\s*\/\s*[^)]+\)/);
      if (match && match[1]) {
        colors.add(match[1].trim());
      }
    }
  });
  return Array.from(colors);
};

const getUniqueSizesHelper = (variants: Variant[]) => {
  const sizes = new Set<string>();
  variants.forEach(variant => {
    // Try to get size from options array first
    if (variant.options && Array.isArray(variant.options)) {
      const sizeOpt = variant.options.find(opt => opt.id.toLowerCase().includes('size'));
      if (sizeOpt) {
        sizes.add(sizeOpt.value);
        return;
      }
    }
    
    // Fallback: Parse from variant name (e.g., "A4 N3142 (Black / S)")
    if (variant.name) {
      const match = variant.name.match(/\([^/]+\s*\/\s*([^)]+)\)/);
      if (match && match[1]) {
        sizes.add(match[1].trim());
      }
    }
  });
  return Array.from(sizes);
};

const ProductDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { productId } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const { setInputs } = usePricing();

  // Sync pricing store with selected variant
  useEffect(() => {
    const base = selectedVariant ? parseFloat(String(selectedVariant.retail_price)) || 0 : 0;
    setInputs(prev => ({
      ...prev,
      currency: selectedVariant?.currency || prev.currency,
      basePrice: base,
      quantity: 1,
      extraPlacements: 0,
      hasInsideLabel: false,
      hasOutsideLabel: false,
      isPremiumImage: false,
      isEmbroidery: false,
      embroideryDigitizationFeeApplicable: false
    }));
  }, [selectedVariant, setInputs]);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${config.endpoints.products}/${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const data = await response.json();
        setProduct(data);
        // Auto-select first available color and size
        const variants = data.sync_variants || data.variants || [];
        if (variants.length > 0) {
          const colors = getUniqueColorsHelper(variants);
          const sizes = getUniqueSizesHelper(variants);
          if (colors.length > 0) setSelectedColor(colors[0]);
          if (sizes.length > 0) setSelectedSize(sizes[0]);
        }
      } catch (err) {
        setError('Failed to load product details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Update selected variant when color or size changes
  useEffect(() => {
    if (product && selectedColor && selectedSize) {
      const variants = getVariants();
      const variant = variants.find(v => {
        // Try options array first
        if (v.options && Array.isArray(v.options)) {
          const colorOpt = v.options.find(opt => opt.id.toLowerCase().includes('color'));
          const sizeOpt = v.options.find(opt => opt.id.toLowerCase().includes('size'));
          if (colorOpt && sizeOpt) {
            return colorOpt.value === selectedColor && sizeOpt.value === selectedSize;
          }
        }
        
        // Fallback: Parse from variant name
        if (v.name) {
          const match = v.name.match(/\(([^/]+)\s*\/\s*([^)]+)\)/);
          if (match) {
            const variantColor = match[1].trim();
            const variantSize = match[2].trim();
            return variantColor === selectedColor && variantSize === selectedSize;
          }
        }
        return false;
      });
      setSelectedVariant(variant || null);
    }
  }, [selectedColor, selectedSize, product]);

  const handleStartDesigning = () => {
    if (selectedVariant) {
      router.push(`/design/${productId}/${selectedVariant.id}?from=builder`);
    }
  };

  const getVariantPreviewImage = (variant: Variant) => {
    // Try to get image from files array first (Store API)
    if (variant.files && variant.files.length > 0) {
      const previewFile = variant.files.find(f => f.type === 'preview');
      if (previewFile) {
        return previewFile.preview_url || previewFile.thumbnail_url;
      }
    }
    
    // Try variant.image directly (Catalog API)
    interface VariantWithImage {
      image?: string;
      [key: string]: unknown;
    }
    const variantWithImage = variant as VariantWithImage;
    if (variantWithImage.image) {
      return variantWithImage.image;
    }
    
    // Fallback to product image or variant product image
    return variant.product?.image || product?.sync_product?.thumbnail_url || product?.product?.image;
  };

  // Helper functions to get product info from either API structure
  const getProductName = () => {
    return product?.sync_product?.name || product?.product?.title || 'Product';
  };

  const getVariants = () => {
    return product?.sync_variants || product?.variants || [];
  };

  const getVariantOptions = (variant: Variant) => {
    if (!variant.options || variant.options.length === 0) {
      return variant.name;
    }
    return variant.options.map(opt => opt.value).join(' / ');
  };

  // Check if a color is available for the selected size
  const isColorAvailable = (color: string) => {
    if (!selectedSize) return true;
    const variants = getVariants();
    return variants.some(v => {
      // Try options array first
      if (v.options && Array.isArray(v.options)) {
        const colorOpt = v.options.find(opt => opt.id.toLowerCase().includes('color'));
        const sizeOpt = v.options.find(opt => opt.id.toLowerCase().includes('size'));
        if (colorOpt && sizeOpt) {
          return colorOpt.value === color && sizeOpt.value === selectedSize;
        }
      }
      
      // Fallback: Parse from variant name
      if (v.name) {
        const match = v.name.match(/\(([^/]+)\s*\/\s*([^)]+)\)/);
        if (match) {
          const variantColor = match[1].trim();
          const variantSize = match[2].trim();
          return variantColor === color && variantSize === selectedSize;
        }
      }
      return false;
    });
  };

  // Check if a size is available for the selected color
  const isSizeAvailable = (size: string) => {
    if (!selectedColor) return true;
    const variants = getVariants();
    return variants.some(v => {
      // Try options array first
      if (v.options && Array.isArray(v.options)) {
        const colorOpt = v.options.find(opt => opt.id.toLowerCase().includes('color'));
        const sizeOpt = v.options.find(opt => opt.id.toLowerCase().includes('size'));
        if (colorOpt && sizeOpt) {
          return colorOpt.value === selectedColor && sizeOpt.value === size;
        }
      }
      
      // Fallback: Parse from variant name
      if (v.name) {
        const match = v.name.match(/\(([^/]+)\s*\/\s*([^)]+)\)/);
        if (match) {
          const variantColor = match[1].trim();
          const variantSize = match[2].trim();
          return variantColor === selectedColor && variantSize === size;
        }
      }
      return false;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/shop')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/shop')}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
          >
            ← Back to Shop
          </button>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {getProductName()}
          </h1>
          <p className="text-gray-600">
            {getVariants().length} variant{getVariants().length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Product Preview */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-4">
              {selectedVariant ? (
                <img
                  src={getVariantPreviewImage(selectedVariant)}
                  alt={selectedVariant.name}
                  className="w-full h-full object-contain p-8"
                />
              ) : (
                <div className="text-6xl">👕</div>
              )}
            </div>
            {selectedVariant && (
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {getVariantOptions(selectedVariant)}
                </h3>
                <p className="text-2xl font-bold text-purple-600">
                  {selectedVariant.currency} {selectedVariant.retail_price}
                </p>
              </div>
            )}
          </div>

          {/* Right: Color and Size Selection */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Customize Your Product</h2>
            
            {/* Color Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Select Color</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {getUniqueColorsHelper(getVariants()).map((color) => {
                  const available = isColorAvailable(color);
                  return (
                    <button
                      key={color}
                      onClick={() => available && setSelectedColor(color)}
                      disabled={!available}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedColor === color
                          ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                          : available
                          ? 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                          : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-center">
                        <p className={`font-medium ${
                          available ? 'text-gray-800' : 'text-gray-400 line-through'
                        }`}>
                          {color}
                        </p>
                        {selectedColor === color && (
                          <div className="text-purple-600 text-xl mt-1">✓</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Select Size</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {getUniqueSizesHelper(getVariants()).map((size) => {
                  const available = isSizeAvailable(size);
                  return (
                    <button
                      key={size}
                      onClick={() => available && setSelectedSize(size)}
                      disabled={!available}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedSize === size
                          ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                          : available
                          ? 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                          : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-center">
                        <p className={`font-semibold ${
                          available ? 'text-gray-800' : 'text-gray-400 line-through'
                        }`}>
                          {size}
                        </p>
                        {selectedSize === size && (
                          <div className="text-purple-600 text-xl mt-1">✓</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Variant Info */}
            {selectedVariant && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Selected:</p>
                    <p className="font-semibold text-gray-800">
                      {selectedColor} / {selectedSize}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedVariant.currency} {selectedVariant.retail_price}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!selectedVariant && selectedColor && selectedSize && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600 text-sm">
                  ⚠️ This combination is not available. Please select a different color or size.
                </p>
              </div>
            )}

            <button
              onClick={handleStartDesigning}
              disabled={!selectedVariant}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                selectedVariant
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedVariant ? 'Start Designing →' : 'Select Color and Size'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
