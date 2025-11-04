'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { config } from '@/config/api';

interface Design {
    _id: string;
    productId?: number;
    productVariantId: number;
    placements: {
        images: any; // can be array or placement map
        texts: any;  // can be array or placement map
    };
    createdAt: string;
}

interface Order {
    _id: string;
    printfulOrderId: string;
    productVariantId?: number;
    variantId?: number;
    storeProductId?: string;
    totalCost: number;
    status: string;
    orderType: 'custom_design' | 'store_product';
    shippingAddress: {
        name: string;
        address1: string;
        city: string;
        state_code: string;
        zip: string;
    };
    createdAt: string;
}

const ProfilePage = () => {
    const router = useRouter();
    const [designs, setDesigns] = useState<Design[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'designs' | 'orders'>('designs');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchUserData(token);
    }, [router]);

    const fetchUserData = async (token: string) => {
        try {
            // Fetch designs
            const designsResponse = await fetch(config.endpoints.designs, {
                headers: {
                    'x-auth-token': token
                }
            });

            if (designsResponse.ok) {
                const designsData = await designsResponse.json();
                setDesigns(designsData);
            }

            // Fetch orders
            const ordersResponse = await fetch(config.endpoints.orders, {
                headers: {
                    'x-auth-token': token
                }
            });

            if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json();
                setOrders(ordersData);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to load profile data');
            setLoading(false);
        }
    };

    const handleDeleteDesign = async (designId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (!confirm('Are you sure you want to delete this design?')) return;

        try {
            const response = await fetch(`${config.apiUrl}/api/designs/${designId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token
                }
            });

            if (response.ok) {
                setDesigns(designs.filter(d => d._id !== designId));
            } else {
                alert('Failed to delete design');
            }
        } catch (err) {
            console.error('Error deleting design:', err);
            alert('An error occurred while deleting the design');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">My Profile</h1>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('designs')}
                            className={`flex-1 py-4 px-6 text-center font-semibold ${
                                activeTab === 'designs'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            My Designs ({designs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex-1 py-4 px-6 text-center font-semibold ${
                                activeTab === 'orders'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            Order History ({orders.length})
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'designs' && (
                    <div className="space-y-4">
                        {designs.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <p className="text-gray-600 mb-4">You haven't saved any designs yet.</p>
                                <Link href="/shop">
                                    <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                                        Start Designing
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            designs.map((design) => (
                                <div key={design._id} className="bg-white rounded-lg shadow p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold mb-2">
                                                Design for Product Variant {design.productVariantId}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-2">
                                                Created: {new Date(design.createdAt).toLocaleDateString()}
                                            </p>
                                            <div className="text-sm text-gray-700">
                                                {(() => {
                                                  const placements: any = design.placements || {};
                                                  const isFlat = placements && (Array.isArray(placements.images) || Array.isArray(placements.texts) || typeof placements.images === 'object' || typeof placements.texts === 'object');
                                                  let imgCount = 0;
                                                  let txtCount = 0;
                                                  if (isFlat) {
                                                    const sumVal = (val: any) => {
                                                      if (Array.isArray(val)) return val.length;
                                                      if (val && typeof val === 'object') {
                                                        return Object.values(val).reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
                                                      }
                                                      return 0;
                                                    };
                                                    imgCount = sumVal(placements.images);
                                                    txtCount = sumVal(placements.texts);
                                                  } else if (placements && typeof placements === 'object') {
                                                    // Per-placement map: { front: { images:[], texts:[] }, ... }
                                                    Object.values(placements).forEach((p: any) => {
                                                      if (p && typeof p === 'object') {
                                                        if (Array.isArray(p.images)) imgCount += p.images.length;
                                                        if (Array.isArray(p.texts)) txtCount += p.texts.length;
                                                      }
                                                    });
                                                  }
                                                  return (
                                                    <>
                                                      <p>Images: {imgCount}</p>
                                                      <p>Text elements: {txtCount}</p>
                                                    </>
                                                  );
                                                })()}
                                            </div>
                                        </div>
                                            <div className="flex gap-2">
                                            <Link href={design.productId ? `/design/${design.productId}/${design.productVariantId}` : `/design/${design.productVariantId}` }>
                                                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                                    Edit
                                                </button>
                                            </Link>
                                                <Link href={design.productId ? `/design/${design.productId}/${design.productVariantId}` : `/design/${design.productVariantId}` }>
                                                    <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                                                        View
                                                    </button>
                                                </Link>
                                            <button
                                                onClick={() => handleDeleteDesign(design._id)}
                                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {orders.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
                                <Link href="/shop">
                                    <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                                        Start Shopping
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div key={order._id} className="bg-white rounded-lg shadow p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-xl font-semibold">
                                                    Order #{order.printfulOrderId}
                                                </h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    order.orderType === 'store_product' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {order.orderType === 'store_product' ? 'Pre-Made' : 'Custom Design'}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-2">
                                                Placed: {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                            <div className="text-sm text-gray-700 space-y-1">
                                                <p><strong>Status:</strong> <span className="capitalize">{order.status.replace('_', ' ')}</span></p>
                                                <p><strong>Total:</strong> ${typeof order.totalCost === 'string' ? order.totalCost : (order.totalCost / 100).toFixed(2)}</p>
                                                {order.productVariantId && (
                                                    <p><strong>Product Variant:</strong> {order.productVariantId}</p>
                                                )}
                                                {order.variantId && (
                                                    <p><strong>Variant ID:</strong> {order.variantId}</p>
                                                )}
                                                {order.storeProductId && (
                                                    <p><strong>Store Product:</strong> {order.storeProductId}</p>
                                                )}
                                                <p><strong>Ship to:</strong> {order.shippingAddress.name}</p>
                                                <p className="text-gray-600">
                                                    {order.shippingAddress.address1}, {order.shippingAddress.city}, {order.shippingAddress.state_code} {order.shippingAddress.zip}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end space-y-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                order.status === 'paid' || order.status === 'fulfilled'
                                                    ? 'bg-green-100 text-green-800'
                                                    : order.status === 'pending_payment'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : order.status === 'failed' || order.status === 'cancelled'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                            {order.status === 'pending_payment' && (
                                                <span className="text-xs text-gray-500">
                                                    Awaiting payment
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
