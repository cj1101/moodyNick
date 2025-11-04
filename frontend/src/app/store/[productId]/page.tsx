'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { config } from '@/config/api';

interface StoreProductVariant {
  id: number;
  variant_id: number;
  product_id: number;
  image: string;
  price: string;
  retail_price: string;
  currency: string;
  size: string;
  color: string;
  color_code: string;
  in_stock: boolean;
}

interface StoreProduct {
  id: string;
  external_id: string;
  name: string;
  thumbnail_url: string;
  variants: StoreProductVariant[];
  type: string;
}

const StoreProductDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<StoreProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`${config.endpoints.storeProductDetails}/${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }
        const data = await response.json();
        
        if (data.result) {
          const productData = data.result;
          setProduct({
            id: productData.id,
            external_id: productData.external_id,
            name: productData.name,
            thumbnail_url: productData.thumbnail_url,
            variants: productData.variants || [],
            type: 'store_product'
          });
          
          // Set first variant as default selection
          if (productData.variants && productData.variants.length > 0) {
            setSelectedVariant(productData.variants[0]);
          }
        } else {
          throw new Error('Product not found');
        }
      } catch (err) {
        setError('Failed to load product details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const handleAddToCart = async () => {
    if (!selectedVariant || !product) return;

    setAddingToCart(true);
    try {
      // Add to local cart
      const cartItem = {
        id: `store-${product.id}-${selectedVariant.id}`,
        type: 'store_product',
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        variant: selectedVariant,
        quantity: quantity,
        price: selectedVariant.retail_price || selectedVariant.price,
        image: selectedVariant.image || product.thumbnail_url
      };

      // Get existing cart
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Check if item already exists in cart
      const existingItemIndex = existingCart.findIndex((item: any) => 
        item.id === cartItem.id
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        existingCart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        existingCart.push(cartItem);
      }

      // Save to localStorage
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // Trigger storage event for navbar update
      window.dispatchEvent(new Event('storage'));

      // Show success message
      alert(`Added ${quantity} ${product.name} to cart!`);
      
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant || !product) return;

    // For now, just add to cart and redirect to checkout
    await handleAddToCart();
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'This product could not be found.'}</p>
          <Link
            href="/store"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-purple-600">Home</Link>
            <span>›</span>
            <Link href="/store" className="hover:text-purple-600">Store</Link>
            <span>›</span>
            <span className="text-gray-800">{product.name}</span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-xl shadow-lg overflow-hidden">
              {selectedVariant?.image ? (
                <img
                  src={selectedVariant.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-8"
                />
              ) : product.thumbnail_url ? (
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-full h-full object-contain p-8"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  📦
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  Pre-Made Product
                </span>
                <span className="text-sm text-gray-500">
                  {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''} available
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>
              {selectedVariant && (
                <div className="text-3xl font-bold text-purple-600 mb-4">
                  ${selectedVariant.retail_price || selectedVariant.price}
                </div>
              )}
            </div>

            {/* Variant Selection */}
            {product.variants.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Variants</h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-800">
                        {variant.size} - {variant.color}
                      </div>
                      <div className="text-sm text-gray-600">
                        ${variant.retail_price || variant.price}
                      </div>
                      {!variant.in_stock && (
                        <div className="text-xs text-red-600 mt-1">Out of Stock</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Quantity</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || addingToCart}
                className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!selectedVariant || addingToCart}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* Product Info */}
            <div className="bg-gray-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">About This Product</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Product Type:</span>
                  <span className="font-medium">Pre-Made</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="font-medium">Standard</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing:</span>
                  <span className="font-medium">1-3 business days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products or Info */}
        <div className="mt-16 bg-white rounded-xl p-8 shadow-lg">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Want to Customize Instead?</h3>
            <p className="text-gray-600 mb-6">
              Create your own unique design with our custom design tool
            </p>
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
  );
};

export default StoreProductDetailPage;
