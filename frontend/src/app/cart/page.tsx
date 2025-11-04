'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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

const CartPage = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

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
        }
        setLoading(false);
    }, []);

    const handleRemoveItem = (itemId: string) => {
        const updatedCart = cart.filter(item => item.id !== itemId);
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('storage')); // Update navbar
    };

    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(itemId);
            return;
        }
        
        const updatedCart = cart.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('storage')); // Update navbar
    };

    const handleClearCart = () => {
        setCart([]);
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('storage')); // Update navbar
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price) || 0;
            return total + (price * item.quantity);
        }, 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading cart...</p>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h1 className="text-3xl font-bold mb-4 text-gray-800">Your cart is empty</h1>
                    <p className="text-gray-600 mb-8">Add some products to get started!</p>
                    <div className="flex gap-4 justify-center">
                    <Link href="/shop">
                            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                                Custom Design
                            </button>
                        </Link>
                        <Link href="/store">
                            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                                Browse Store
                        </button>
                    </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Your Cart</h1>
                    <button
                        onClick={handleClearCart}
                        className="text-red-600 hover:text-red-800 font-medium"
                    >
                        Clear Cart
                    </button>
                </div>
                
                <div className="space-y-4 mb-8">
                    {cart.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start space-x-4">
                                {/* Product Image */}
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-2xl">
                                            {item.type === 'store_product' ? '📦' : '🎨'}
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    item.type === 'store_product' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {item.type === 'store_product' ? 'Pre-Made' : 'Custom Design'}
                                                </span>
                                                {item.variant && (
                                                    <span className="text-sm text-gray-600">
                                                        {item.variant.size} - {item.variant.color}
                                                    </span>
                                                )}
                                            </div>
                                            {item.design && (
                                                <div className="text-sm text-gray-600">
                                                    <span>Images: {item.design.images?.length || 0}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>Text: {item.design.texts?.length || 0}</span>
                                                </div>
                                            )}
                        </div>
                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                        >
                                            ✕
                        </button>
                    </div>
                    
                                    {/* Quantity and Price */}
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                            >
                                                -
                                            </button>
                                            <span className="text-lg font-medium w-8 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-800">
                                                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                ${item.price} each
                                            </div>
                                        </div>
                                    </div>
                                </div>
                    </div>
                        </div>
                    ))}
                </div>

                {/* Cart Summary */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total ({cart.length} item{cart.length !== 1 ? 's' : ''}):</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Shipping and taxes will be calculated at checkout
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <Link href="/shop" className="flex-1">
                        <button className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors">
                            Continue Shopping
                        </button>
                    </Link>
                    <Link href="/checkout" className="flex-1">
                        <button className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                            Proceed to Checkout
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
