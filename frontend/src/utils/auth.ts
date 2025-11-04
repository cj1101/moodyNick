/**
 * Authentication utilities for handling JWT tokens
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Check if user is authenticated by verifying token exists
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

/**
 * Get the current authentication token
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

/**
 * Clear authentication data
 */
export const clearAuth = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Handle API response for authentication errors
 * Returns true if the error was handled (user redirected to login)
 */
export const handleAuthError = (response: Response, errorData: { msg?: string }, router: AppRouterInstance): boolean => {
  if (response.status === 401 && errorData.msg === 'Token is not valid') {
    // Clear invalid token and redirect to login
    clearAuth();
    alert('Your session has expired. Please log in again.');
    router.push('/login');
    return true;
  }
  return false;
};

/**
 * Make an authenticated API request with automatic token validation
 */
export const authenticatedFetch = async (
  url: string, 
  options: RequestInit = {}, 
  router: AppRouterInstance
): Promise<Response> => {
  const token = getToken();
  
  if (!token) {
    alert('Please log in to continue');
    router.push('/login');
    throw new Error('No authentication token');
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-auth-token': token,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Check for authentication errors
  if (!response.ok && response.status === 401) {
    try {
      const errorData = await response.json();
      if (handleAuthError(response, errorData, router)) {
        throw new Error('Authentication failed - redirected to login');
      }
    } catch {
      // If we can't parse the error, still clear auth and redirect
      clearAuth();
      alert('Your session has expired. Please log in again.');
      router.push('/login');
      throw new Error('Authentication failed - redirected to login');
    }
  }

  return response;
};
