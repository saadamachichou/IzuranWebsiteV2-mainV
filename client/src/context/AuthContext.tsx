import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@shared/schema";
import { 
  signInWithGoogle, 
  signInWithGoogleRedirect, 
  getGoogleRedirectResult,
  signOut as firebaseSignOut
} from "@/lib/firebase";
import { fetchWithTokenRefresh, mightHaveValidSession } from "@/lib/tokenUtils";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  handleGoogleRedirect: () => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateProfilePicture: (file: File) => Promise<string>;
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        
        // Use localStorage so "remember me" survives reloads and new tabs
        const isInitialLoad = !localStorage.getItem('authChecked');
        
        // Skip auth check only if we've already checked and there's no auth flag
        if (!mightHaveValidSession() && !isInitialLoad) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Use our fetchWithTokenRefresh which handles token refresh automatically
        const response = await fetchWithTokenRefresh('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem('hasAuthSession', 'true');
        } else {
          // 401 is expected when user is not authenticated - silently handle
          setUser(null);
          localStorage.removeItem('hasAuthSession');
        }
      } catch (err) {
        // Silently handle errors - expected when user is not authenticated
        setUser(null);
        localStorage.removeItem('hasAuthSession');
      } finally {
        setIsLoading(false);
        localStorage.setItem('authChecked', 'true');
      }
    };

    checkAuthStatus();
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

  // Google login with popup
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Starting Google authentication process...");
      
      // Get user and access token from Firebase
      const { user: firebaseUser, accessToken } = await signInWithGoogle();
      console.log("[DEBUG] Firebase user object:", firebaseUser);
      console.log("[DEBUG] Google photoURL:", firebaseUser.photoURL);
      console.log("[DEBUG] Google OAuth accessToken:", accessToken);
      if (!firebaseUser) {
        console.error("Firebase returned no user after Google sign-in");
        throw new Error('Google authentication failed - No user data received');
      }
      
      // Step 1: Authenticate with backend using Google profile URL (even if it's a Google URL)
      const userData = {
        providerId: firebaseUser.uid,
        email: firebaseUser.email,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
        firstName: firebaseUser.displayName?.split(' ')[0],
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' '),
        profilePictureUrl: firebaseUser.photoURL?.replace('=s96-c', '=s400-c'), // Google URL
        authProvider: 'google',
        accessToken,
      };
      console.log("[DEBUG] Payload sent to backend:", userData);
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      let backendUser;
      try {
        const data = await response.json();
        console.log("[DEBUG] Backend response:", data);
        setUser(data.user);
        backendUser = data.user;
      } catch (jsonError) {
        console.error("Error parsing successful response:", jsonError);
        throw new Error('Failed to process authentication response');
      }
      // Step 2: Now upload the Google image to your server (if photoURL exists)
      if (firebaseUser.photoURL) {
        const localProfilePictureUrl = await fetchAndUploadGoogleProfileImage(firebaseUser.photoURL.replace('=s96-c', '=s400-c'));
        if (localProfilePictureUrl) {
          // PATCH the user profile to update the profilePictureUrl to the local one
          await fetch('/api/auth/profile-picture-url', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profilePictureUrl: localProfilePictureUrl }),
            credentials: 'include'
          });
          // Reload user from backend to get the latest profilePictureUrl
          const refreshed = await fetchWithTokenRefresh('/api/auth/me');
          if (refreshed.ok) {
            const refreshedData = await refreshed.json();
            setUser(refreshedData.user);
          } else {
            // fallback: update the user in context
            setUser((prev) => prev ? { ...prev, profilePictureUrl: localProfilePictureUrl } : prev);
          }
        }
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle redirect result from Google login (mobile friendly)
  const handleGoogleRedirect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Checking for Google sign-in redirect result...");
      
      // Get user from Firebase redirect
      const firebaseUser = await getGoogleRedirectResult();
      if (!firebaseUser) {
        console.log("No redirect result found, user may not have attempted Google sign-in");
        return; // Not an error, normal state for most page loads
      }
      
      console.log("Firebase redirect result received, authenticating with backend");
      
      // Prepare user data from Firebase
      const userData = {
        providerId: firebaseUser.uid,
        email: firebaseUser.email,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
        firstName: firebaseUser.displayName?.split(' ')[0],
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' '),
        profilePictureUrl: firebaseUser.photoURL?.replace('=s96-c', '=s400-c'),
        authProvider: 'google',
      };
      
      console.log("Sending user data to backend:", {
        providerId: userData.providerId?.substring(0, 5) + '...',
        email: userData.email?.substring(0, 3) + '...',
        username: userData.username
      });
      
      // Authenticate with our backend
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      // Handle non-OK responses
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
      
      // Handle successful response
      try {
        const data = await response.json();
        console.log("Backend authentication successful, user logged in");
        setUser(data.user);
      } catch (jsonError) {
        console.error("Error parsing successful response:", jsonError);
        throw new Error('Failed to process authentication response');
      }
    } catch (err: any) {
      console.error('Google redirect error:', err);
      setError(err.message || 'Google authentication failed');
      // Don't throw error for redirect, it could be a normal page load
    } finally {
      setIsLoading(false);
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

  // Check for Google redirect on initial load
  useEffect(() => {
    handleGoogleRedirect();
  }, []);

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