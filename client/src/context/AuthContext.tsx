import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@shared/schema";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { 
  auth as firebaseAuth,
  signInWithGoogle, 
  signInWithGoogleRedirect, 
  getGoogleRedirectResult,
  isRealMobileDevice,
  signOut as firebaseSignOut
} from "@/lib/firebase";
import { fetchWithTokenRefresh, mightHaveValidSession } from "@/lib/tokenUtils";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ redirecting: boolean }>;
  handleGoogleRedirect: () => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateProfilePicture: (file: File) => Promise<string>;
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function waitForFirebaseUserAfterRedirect(timeoutMs = 8000): Promise<FirebaseUser | null> {
  if (!firebaseAuth) return null;

  // Fast path: user is already available.
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;

  return new Promise((resolve) => {
    let settled = false;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (settled) return;
      if (user) {
        settled = true;
        clearTimeout(timer);
        unsubscribe();
        resolve(user);
      }
    });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(firebaseAuth.currentUser ?? null);
    }, timeoutMs);
  });
}

async function fetchAndUploadGoogleProfileImage(photoURL: string): Promise<string | null> {
  try {
    const response = await fetch(photoURL);
    // Check if the response is an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('Google image fetch did not return an image. Content-Type:', contentType);
      return null;
    }
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('profilePicture', blob, 'google-profile.jpg');
    const uploadResponse = await fetch('/api/auth/profile-picture', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload profile picture');
    }
    const data = await uploadResponse.json();
    return data.profilePictureUrl; // This should be the local URL
  } catch (err) {
    console.error('Error uploading Google profile image:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // On load: process Google redirect (mobile return) then check auth status.
  // isLoading is managed exclusively here to avoid intermediate flickers that
  // would cause ProtectedAdminRoute to flash-redirect to /auth.
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // 1. On real mobile devices, handle a possible Google redirect return.
        //    ONLY do the expensive Firebase redirect check when a redirect was
        //    actually initiated (flag in sessionStorage).  This eliminates a
        //    4+ second delay on every normal mobile page load.
        const redirectPending = sessionStorage.getItem('googleRedirectPending') === 'true';
        if (isRealMobileDevice() && redirectPending) {
          await handleGoogleRedirect();
        }

        // 2. Check server-side auth status (session + JWT cookies).
        const shouldCheck = redirectPending || mightHaveValidSession();
        if (shouldCheck) {
          const response = await fetchWithTokenRefresh('/api/auth/me');
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            localStorage.setItem('hasAuthSession', 'true');
          } else {
            setUser(null);
            localStorage.removeItem('hasAuthSession');
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem('hasAuthSession');
      } finally {
        setIsLoading(false);
        localStorage.setItem('authChecked', 'true');
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // This ensures cookies are sent with the request
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      // The access token is now stored in an HTTP-only cookie
      // We don't need to manually store it in localStorage or memory
      if (data.accessToken) {
        console.log("Access token received (stored in HTTP-only cookies)");
      }
      
      setUser(data.user);
      localStorage.setItem('hasAuthSession', 'true');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, confirmPassword: string, firstName?: string, lastName?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, confirmPassword, firstName, lastName }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      // Automatically log in after successful registration
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }
      
      // Clear auth session flags (localStorage so they persist across reloads when logged in)
      localStorage.removeItem('hasAuthSession');
      localStorage.removeItem('authChecked');
      setUser(null);
      
      // Also sign out of Firebase if user was signed in with Google
      if (user?.authProvider === 'google') {
        try {
          await firebaseSignOut();
        } catch (firebaseErr) {
          console.error('Error signing out of Firebase:', firebaseErr);
          // Continue with logout even if Firebase signout fails
        }
      }
      
      localStorage.removeItem('hasAuthSession');
      localStorage.removeItem('authChecked');
      setUser(null);
      
      // Clear profile upload flags for all users
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('profileUploaded_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Google login — always try popup first (works on both desktop and mobile).
  // signInWithPopup opens a new tab on mobile browsers which avoids the
  // cross-origin redirect-state-recovery problem that breaks signInWithRedirect
  // when authDomain differs from the app origin.
  // Falls back to redirect only if the popup is explicitly blocked.
  const loginWithGoogle = async (): Promise<{ redirecting: boolean }> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("[AUTH:LOGIN_GOOGLE]", {
        isMobile: isRealMobileDevice(),
        screenWidth: window.innerWidth,
        userAgent: navigator.userAgent,
      });

      let firebaseUser: import("firebase/auth").User;
      let accessToken: string | undefined;

      try {
        const result = await signInWithGoogle();
        firebaseUser = result.user;
        accessToken = result.accessToken;
      } catch (popupErr: any) {
        if (popupErr?.code === 'auth/popup-closed-by-user' || popupErr?.code === 'auth/cancelled-popup-request') {
          return { redirecting: false };
        }

        // Popup was blocked — fall back to redirect as last resort
        if (popupErr?.code === 'auth/popup-blocked') {
          console.warn("[AUTH:LOGIN_GOOGLE] Popup blocked, falling back to redirect");
          await signInWithGoogleRedirect();
          return { redirecting: true };
        }

        throw popupErr;
      }

      if (!firebaseUser) {
        throw new Error('Google authentication failed - No user data received');
      }

      // Authenticate with backend
      const userData = {
        providerId: firebaseUser.uid,
        email: firebaseUser.email,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
        firstName: firebaseUser.displayName?.split(' ')[0],
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' '),
        profilePictureUrl: firebaseUser.photoURL?.replace('=s96-c', '=s400-c'),
        authProvider: 'google',
        accessToken,
      };
      console.log("[AUTH:LOGIN_GOOGLE] Sending to backend...");
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      if (!response.ok) {
        let errorMsg = 'Google authentication failed on the server';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
          console.error("Backend auth error:", errorData);
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log("[AUTH:LOGIN_GOOGLE] Backend success");
      setUser(data.user);
      localStorage.setItem('hasAuthSession', 'true');

      // Upload Google profile image to local server in background
      if (firebaseUser.photoURL) {
        const localProfilePictureUrl = await fetchAndUploadGoogleProfileImage(firebaseUser.photoURL.replace('=s96-c', '=s400-c'));
        if (localProfilePictureUrl) {
          await fetch('/api/auth/profile-picture-url', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profilePictureUrl: localProfilePictureUrl }),
            credentials: 'include'
          });
          const refreshed = await fetchWithTokenRefresh('/api/auth/me');
          if (refreshed.ok) {
            const refreshedData = await refreshed.json();
            setUser(refreshedData.user);
          } else {
            setUser((prev) => prev ? { ...prev, profilePictureUrl: localProfilePictureUrl } : prev);
          }
        }
      }
      return { redirecting: false };
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handles the return from a Google signInWithRedirect (mobile fallback).
  // Does NOT manage isLoading — the caller (init) is responsible.
  const handleGoogleRedirect = async () => {
    const redirectTs = parseInt(sessionStorage.getItem('googleRedirectTimestamp') || '0');
    const redirectAgeMs = Date.now() - redirectTs;
    const isReturningFromRedirect = redirectAgeMs < 5 * 60 * 1000;

    console.log("[AUTH:HANDLE_REDIRECT]", { isReturningFromRedirect, redirectAgeMs });

    if (!isReturningFromRedirect) {
      sessionStorage.removeItem('googleRedirectPending');
      sessionStorage.removeItem('googleRedirectTimestamp');
      return;
    }

    const TIMEOUT_MS = 20000;

    try {
      let firebaseUser = await Promise.race([
        getGoogleRedirectResult().catch((err) => {
          console.error("[AUTH:HANDLE_REDIRECT] getGoogleRedirectResult threw:", err?.message);
          return null;
        }),
        new Promise<null>((resolve) =>
          setTimeout(() => {
            console.warn(`[AUTH:HANDLE_REDIRECT] Timed out after ${TIMEOUT_MS}ms`);
            resolve(null);
          }, TIMEOUT_MS)
        ),
      ]);

      if (!firebaseUser) {
        firebaseUser = await waitForFirebaseUserAfterRedirect(8000);
        if (firebaseUser) {
          console.log("[AUTH:HANDLE_REDIRECT] Fallback recovered Firebase user via auth state");
        } else {
          console.warn("[AUTH:HANDLE_REDIRECT] No Firebase user from redirect result or auth-state fallback");
        }
      }

      sessionStorage.removeItem('googleRedirectPending');
      sessionStorage.removeItem('googleRedirectTimestamp');

      if (!firebaseUser) return;

      console.log("[AUTH:HANDLE_REDIRECT] User received, authenticating with backend...");

      const userData = {
        providerId: firebaseUser.uid,
        email: firebaseUser.email,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
        firstName: firebaseUser.displayName?.split(' ')[0],
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' '),
        profilePictureUrl: firebaseUser.photoURL?.replace('=s96-c', '=s400-c'),
        authProvider: 'google',
      };

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      console.log("[AUTH:HANDLE_REDIRECT] Backend response:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Google authentication failed on the server');
      }

      const data = await response.json();
      console.log("[AUTH:HANDLE_REDIRECT] SUCCESS — user logged in");
      setUser(data.user);
      localStorage.setItem('hasAuthSession', 'true');
    } catch (err: any) {
      console.error("[AUTH:HANDLE_REDIRECT] Error:", err.message);
      setError(err.message || 'Google authentication failed');
    }
  };

  // Upload and update profile picture
  const updateProfilePicture = async (file: File): Promise<string> => {
    if (user?.authProvider === 'google') {
      throw new Error('Google users cannot change their profile picture manually.');
    }
    try {
      setIsLoading(true);
      setError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      // Upload to server with token refresh support
      const response = await fetchWithTokenRefresh('/api/auth/profile-picture', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile picture');
      }
      
      const data = await response.json();
      
      // Update user state with new profile picture
      if (user) {
        setUser({
          ...user,
          profilePictureUrl: data.profilePictureUrl
        });
      }
      
      return data.profilePictureUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile picture');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchWithTokenRefresh('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        loginWithGoogle,
        handleGoogleRedirect,
        register,
        logout,
        clearError,
        updateProfilePicture,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}