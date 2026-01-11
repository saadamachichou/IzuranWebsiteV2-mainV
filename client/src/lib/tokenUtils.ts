/**
 * Utility functions for handling JWT tokens in our application
 */

// Tracks whether a token refresh is in progress
let isRefreshing = false;
// Queue of functions to call after token refresh completes
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Add callback to be invoked once token is refreshed
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Call all subscribers with the new token
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * Refresh the access token using the HTTP-only refresh token cookie
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    // Return a promise that resolves when the current refresh completes
    return new Promise<string>((resolve) => {
      subscribeTokenRefresh(token => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      credentials: 'include' // Important for sending HTTP-only cookies
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const newToken = data.accessToken;
    
    isRefreshing = false;
    onTokenRefreshed(newToken);
    
    return newToken;
  } catch (error) {
    // Silently handle expected 401 errors when user is not authenticated
    // Don't log to console to avoid cluttering console with expected errors
    isRefreshing = false;
    
    // Clear the subscribers on error
    refreshSubscribers = [];
    
    return null;
  }
}

/**
 * Check if we might have a valid session (to avoid unnecessary requests)
 */
export function mightHaveValidSession(): boolean {
  // Check sessionStorage flag to avoid unnecessary requests for users who never logged in
  return sessionStorage.getItem('hasAuthSession') === 'true' || 
         !sessionStorage.getItem('authChecked');
}

/**
 * Wrapped fetch function that handles token refresh
 */
export async function fetchWithTokenRefresh(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Ensure credentials are included for cookies
  const requestOptions = {
    ...options,
    credentials: 'include' as RequestCredentials
  };
  
  // First attempt
  let response = await fetch(url, requestOptions);
  
  // If unauthorized and not already a refresh token request
  if (response.status === 401 && !url.includes('/api/auth/refresh-token')) {
    // Only attempt refresh if we might have a valid session
    if (mightHaveValidSession()) {
      // Try to refresh the token
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        // Token refreshed, retry original request
        return fetch(url, requestOptions);
      } else {
        // Refresh failed, clear the session flag
        sessionStorage.removeItem('hasAuthSession');
      }
    }
    // If refresh failed or no session, return the response without retrying
    // This is expected when user is not authenticated
  }
  
  return response;
}