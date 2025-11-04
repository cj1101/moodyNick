
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Get cart count
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);

    // Listen for storage changes (cart updates)
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check periodically for same-tab updates
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    setIsLoggedIn(false);
    setCartCount(0);
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            MoodyNick
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`hover:text-purple-600 transition-colors ${pathname === '/' ? 'text-purple-600 font-semibold' : 'text-gray-700'}`}
            >
              Home
            </Link>
            <Link 
              href="/shop" 
              className={`hover:text-purple-600 transition-colors ${pathname === '/shop' ? 'text-purple-600 font-semibold' : 'text-gray-700'}`}
            >
              Shop
            </Link>
            <Link 
              href="/store" 
              className={`hover:text-purple-600 transition-colors ${pathname === '/store' ? 'text-purple-600 font-semibold' : 'text-gray-700'}`}
            >
              Store
            </Link>
            {isLoggedIn && (
              <Link 
                href="/profile" 
                className={`hover:text-purple-600 transition-colors ${pathname === '/profile' ? 'text-purple-600 font-semibold' : 'text-gray-700'}`}
              >
                Profile
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link href="/cart" className="relative hover:text-purple-600 transition-colors">
              <span className="text-2xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Logout
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 flex justify-around border-t pt-2">
          <Link 
            href="/" 
            className={`text-sm ${pathname === '/' ? 'text-purple-600 font-semibold' : 'text-gray-700'}`}
          >
            Home
          </Link>
          <Link 
            href="/shop" 
            className={`text-sm ${pathname === '/shop' ? 'text-purple-600 font-semibold' : 'text-gray-700'}`}
          >
            Shop
          </Link>
          <Link 
            href="/store" 
            className={`text-sm ${pathname === '/store' ? 'text-purple-600 font-semibold' : 'text-gray-700'}`}
          >
            Store
          </Link>
          {isLoggedIn && (
            <Link 
              href="/profile" 
              className={`text-sm ${pathname === '/profile' ? 'text-purple-600 font-semibold' : 'text-gray-700'}`}
            >
              Profile
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
