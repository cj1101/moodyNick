'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config/api';
import { authenticatedFetch, handleAuthError } from '@/utils/auth';
import { usePricing } from '@/state/pricing/pricingStore';
import { estimateShippingAndTax } from '@/lib/pricing/fetchShippingTax';

interface CartItem {
    id: string;
    type: 'custom_design' | 'store_product';
    productId?: string;
    variantId?: number;
    productVariantId?: number;
    name: string;
    variant?: any;
    quantity: number;
    price: string;
    image: string;
    design?: {
        images: any[];
        texts: any[];
        files: any[];
    };
}

const CheckoutPage = () => {
    const router = useRouter();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [shippingAddress, setShippingAddress] = useState({
        name: '',
        address1: '',
        address2: '',
        city: '',
        state_code: '',
        country_code: 'US',
        zip: ''
    });
  const { setInputs, setEstimateShippingAndTax } = usePricing();

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const cartData = JSON.parse(savedCart);
                setCart(Array.isArray(cartData) ? cartData : []);
            } catch (error) {
                console.error('Error parsing cart data:', error);
                setCart([]);
            }
        } else {
            router.push('/cart');
        }
    }, [router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setShippingAddress(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price) || 0;
            return total + (price * item.quantity);
        }, 0);
    };

  // Sync sticky bar with cart total and live estimates
  useEffect(() => {
    const baseTotal = calculateTotal();
    setInputs(prev => ({
      ...prev,
      currency: 'USD',
      basePrice: baseTotal,
      quantity: 1,
      extraPlacements: 0,
      hasInsideLabel: false,
      hasOutsideLabel: false,
      isPremiumImage: false,
      isEmbroidery: false,
      embroideryDigitizationFeeApplicable: false
    }));

    const run = async () => {
      try {
        const est = await estimateShippingAndTax({
          countryCode: shippingAddress.country_code,
          stateCode: shippingAddress.state_code,
          zip: shippingAddress.zip,
          items: cart.map(ci => ({ quantity: ci.quantity, price: parseFloat(ci.price) || 0 }))
        });
        setEstimateShippingAndTax(est.shippingAmount, est.taxAmount);
      } catch {}
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, shippingAddress.country_code, shippingAddress.state_code, shippingAddress.zip]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Process each item in cart
            const checkoutUrls: string[] = [];
            
            for (const item of cart) {
                if (item.type === 'store_product') {
                    // Create store product order
                    const response = await authenticatedFetch(`${config.endpoints.base}/api/orders/create-store-order`, {
                        method: 'POST',
                        body: JSON.stringify({
                            storeProductId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            shippingAddress,
                            promoCode
                        })
                    }, router);

                    if (!response.ok) {
                        const errorData = await response.json();
                        
                        // Check if it's an auth error that wasn't handled by authenticatedFetch
                        if (handleAuthError(response, errorData, router)) {
                            setLoading(false);
                            return;
                        }
                        
                        const pfMsg = errorData?.error?.result?.messages?.[0]?.message;
                        const detail = pfMsg || errorData?.error?.message || errorData?.error?.error || errorData?.message || (typeof errorData === 'string' ? errorData : undefined);
                        throw new Error(detail || 'Failed to create store order');
                    }

                    const orderData = await response.json();
                    checkoutUrls.push(orderData.checkoutUrl);
                } else if (item.type === 'custom_design') {
                    // Create custom design order
                    const response = await authenticatedFetch(`${config.endpoints.base}/api/orders/create-order`, {
                        method: 'POST',
                        body: JSON.stringify({
                            productVariantId: item.productVariantId,
                            design: item.design,
                            shippingAddress,
                            totalCost: parseFloat(item.price) * item.quantity,
                            promoCode
                        })
                    }, router);

                    if (!response.ok) {
                        const errorData = await response.json();
                        
                        // Check if it's an auth error that wasn't handled by authenticatedFetch
                        if (handleAuthError(response, errorData, router)) {
                            setLoading(false);
                            return;
                        }
                        
                        const pfMsg = errorData?.error?.result?.messages?.[0]?.message;
                        const detail = pfMsg || errorData?.error?.message || errorData?.error?.error || errorData?.message || (typeof errorData === 'string' ? errorData : undefined);
                        throw new Error(detail || 'Failed to create custom order');
                    }

                    const orderData = await response.json();
                    checkoutUrls.push(orderData.checkoutUrl);
                }
            }

            // Clear cart
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('storage')); // Update navbar

            // If we have checkout URLs, redirect to the first one
            if (checkoutUrls.length > 0) {
                // For now, redirect to the first checkout URL
                // In a more sophisticated implementation, you might want to handle multiple orders
                window.location.href = checkoutUrls[0];
            } else {
                throw new Error('No checkout URLs generated');
            }

        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message || 'An error occurred during checkout');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h1 className="text-3xl font-bold mb-4 text-gray-800">Your cart is empty</h1>
                    <p className="text-gray-600 mb-8">Add some products to get started!</p>
                    <button
                        onClick={() => router.push('/shop')}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Checkout</h1>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Order Summary</h2>
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-contain rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-lg">
                                                {item.type === 'store_product' ? '📦' : '🎨'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.type === 'store_product' 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-purple-100 text-purple-800'
                                            }`}>
                                                {item.type === 'store_product' ? 'Pre-Made' : 'Custom'}
                                            </span>
                                            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-gray-800">
                                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                                <span>Total:</span>
                                <span>${calculateTotal().toFixed(2)}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                                Shipping and taxes will be calculated by Printful
                            </p>
                            <div className="mt-4">
                                <label htmlFor="promo" className="block text-sm font-medium text-gray-700 mb-1">Promo code</label>
                                <input
                                    id="promo"
                                    type="text"
                                    value={promoCode}
                                    onChange={e => setPromoCode(e.target.value)}
                                    placeholder="Enter promo code"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Use "nickfriendsfamily" to pay regular retail.</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Form */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Shipping Information</h2>
                        
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={shippingAddress.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Address Line 1</label>
                                <input
                                    type="text"
                                    name="address1"
                                    value={shippingAddress.address1}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Address Line 2 (Optional)</label>
                                <input
                                    type="text"
                                    name="address2"
                                    value={shippingAddress.address2}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={shippingAddress.city}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">State</label>
                                    <input
                                        type="text"
                                        name="state_code"
                                        value={shippingAddress.state_code}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="CA"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">ZIP Code</label>
                                <input
                                    type="text"
                                    name="zip"
                                    value={shippingAddress.zip}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-400"
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                                <h3 className="font-semibold text-blue-800 mb-2">🔒 Secure Checkout</h3>
                                <p className="text-sm text-blue-700">
                                    You'll be redirected to Printful's secure checkout page to complete your payment. 
                                    Your payment information is processed securely by Printful.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Creating Order...' : 'Proceed to Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
