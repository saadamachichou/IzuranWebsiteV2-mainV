import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage,
} from "firebase/storage";

const FIREBASE_NOT_CONFIGURED = "Firebase is not configured (missing VITE_FIREBASE_* env).";

function getFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  if (!apiKey || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: `${projectId}.appspot.com`,
    appId,
  };
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  const config = getFirebaseConfig();
  if (config) {
    app = initializeApp(config);
    auth = getAuth(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    googleProvider.addScope("profile");
    googleProvider.addScope("https://www.googleapis.com/auth/userinfo.profile");
  }
} catch (e) {
  console.warn("Firebase initialization failed:", e);
}

/**
 * Signs in with Google via popup
 */
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) throw new Error(FIREBASE_NOT_CONFIGURED);
  try {
    console.log("Starting Google sign-in with popup...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign-in successful, user info received");
    // Return both the user and the OAuth access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    return { user: result.user, accessToken };
  } catch (error: any) {
    // Get detailed error information
    let errorMessage = "Unknown error during Google sign-in";
    let errorCode = "unknown";
    
    if (error.code) {
      errorCode = error.code;
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/popup-blocked':
          errorMessage = "The popup was blocked by the browser. Please enable popups for this site.";
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = "The sign-in popup was closed before the operation completed.";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "The sign-in popup request was cancelled.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "A network error occurred during sign-in. Please check your connection.";
          break;
        default:
          errorMessage = error.message || "Error during Google sign-in";
      }
    }
    
    console.error("Error signing in with Google:", {
      code: errorCode,
      message: errorMessage,
      originalError: error
    });
    
    throw new Error(errorMessage);
  }
};

/**
 * Initiates Google sign-in with redirect (better for mobile)
 */
export const signInWithGoogleRedirect = async () => {
  if (!auth || !googleProvider) throw new Error(FIREBASE_NOT_CONFIGURED);
  try {
    console.log("Starting Google sign-in with redirect...");
    await signInWithRedirect(auth, googleProvider);
    console.log("Redirect initiated successfully");
  } catch (error: any) {
    let errorMessage = error.message || "Failed to initiate Google sign-in redirect";
    console.error("Error initiating Google sign-in redirect:", {
      code: error.code || "unknown",
      message: errorMessage,
      error
    });
    throw new Error(errorMessage);
  }
};

/**
 * Gets the redirect result after Google sign-in
 */
export const getGoogleRedirectResult = async () => {
  if (!auth) throw new Error(FIREBASE_NOT_CONFIGURED);
  try {
    console.log("Checking for Google sign-in redirect result...");
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log("Google sign-in redirect result received");
      return result.user;
    } else {
      console.log("No Google sign-in redirect result found");
      return null;
    }
  } catch (error: any) {
    let errorMessage = "Unknown error getting Google sign-in result";
    let errorCode = "unknown";
    
    if (error.code) {
      errorCode = error.code;
      switch (error.code) {
        case 'auth/network-request-failed':
          errorMessage = "Network error while getting redirect result. Please check your connection.";
          break;
        default:
          errorMessage = error.message || "Error getting Google sign-in result";
      }
    }
    
    console.error("Error getting Google redirect result:", {
      code: errorCode,
      message: errorMessage,
      error
    });
    
    throw new Error(errorMessage);
  }
};

/**
 * Signs out the current user
 */
export const signOut = async () => {
  if (!auth) throw new Error(FIREBASE_NOT_CONFIGURED);
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

/**
 * Uploads a profile picture to Firebase Storage
 */
export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  if (!storage) throw new Error(FIREBASE_NOT_CONFIGURED);
  try {
    const storageRef = ref(storage, `profile_pictures/${userId}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

// Export Firebase instances (may be null if not configured)
export { auth, storage, app };