'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const OrderConfirmationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderStatus, setOrderStatus] = useState<'success' | 'cancelled' | 'pending'>('pending');

  useEffect(() => {
    // Check URL parameters to determine order status
    const status = searchParams.get('status');
    const orderId = searchParams.get('order_id');
    
    if (status === 'success' || orderId) {
      setOrderStatus('success');
    } else if (status === 'cancelled') {
      setOrderStatus('cancelled');
    } else {
      setOrderStatus('success'); // Default to success if no clear indication
    }
  }, [searchParams]);

  if (orderStatus === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Cancelled</h1>
          <p className="text-gray-600 mb-6">
            Your order was cancelled. No charges have been made to your account.
          </p>
          <div className="space-y-3">
            <Link
              href="/cart"
              className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Return to Cart
            </Link>
            <Link
              href="/store"
              className="block w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your purchase! Your order has been successfully placed.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">What happens next?</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Order Processing</h3>
                  <p className="text-sm text-gray-600">Your order is being processed by Printful (1-3 business days)</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Production</h3>
                  <p className="text-sm text-gray-600">Your product is being printed and prepared for shipping</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Shipping</h3>
                  <p className="text-sm text-gray-600">Your order will be shipped and you&apos;ll receive tracking information</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">📧 Email Confirmation</h3>
            <p className="text-sm text-blue-700">
              You should receive an email confirmation shortly with your order details and tracking information.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/profile"
              className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Order History
            </Link>
            <div className="flex gap-3">
              <Link
                href="/store"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Store
              </Link>
              <Link
                href="/shop"
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Custom Design
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions about your order? Contact us at{' '}
              <a href="mailto:support@moodynick.com" className="text-purple-600 hover:text-purple-700">
                support@moodynick.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
