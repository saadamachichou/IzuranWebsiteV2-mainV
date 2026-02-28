import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  type Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  browserLocalPersistence,
  browserPopupRedirectResolver,
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
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    googleProvider.addScope("profile");
    googleProvider.addScope("https://www.googleapis.com/auth/userinfo.profile");
  }
} catch (e) {
  console.warn("Firebase initialization failed:", e);
}

export function isRealMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Signs in with Google via popup.
 * Works on both desktop (opens popup) and mobile (opens new tab).
 * Must be called from a direct user-interaction handler (click) so the
 * browser allows the popup/tab to open.
 */
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) throw new Error(FIREBASE_NOT_CONFIGURED);
  try {
    console.log("[AUTH:POPUP] Starting Google sign-in with popup...", {
      authDomain: auth.app.options.authDomain,
      isMobile: isRealMobileDevice(),
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
    });
    const result = await signInWithPopup(auth, googleProvider);
    console.log("[AUTH:POPUP] Google sign-in successful");
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return { user: result.user, accessToken: credential?.accessToken };
  } catch (error: any) {
    const errorCode = error.code || "unknown";
    console.error("[AUTH:POPUP] Error:", { code: errorCode, message: error.message });

    const thrownError = new Error(error.message || "Unknown error during Google sign-in") as Error & { code: string };
    thrownError.code = errorCode;
    throw thrownError;
  }
};

/**
 * Fallback: initiates Google sign-in with a full-page redirect.
 * Only used when signInWithPopup fails with auth/popup-blocked.
 */
export const signInWithGoogleRedirect = async () => {
  if (!auth || !googleProvider) throw new Error(FIREBASE_NOT_CONFIGURED);
  console.log("[AUTH:REDIRECT] Starting Google sign-in with redirect (popup fallback)...", {
    authDomain: auth.app.options.authDomain,
    currentUrl: window.location.href,
    timestamp: new Date().toISOString(),
  });
  sessionStorage.setItem('googleRedirectPending', 'true');
  sessionStorage.setItem('googleRedirectTimestamp', Date.now().toString());
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    sessionStorage.removeItem('googleRedirectPending');
    sessionStorage.removeItem('googleRedirectTimestamp');
    console.error("[AUTH:REDIRECT] Failed to initiate redirect:", {
      code: error.code,
      message: error.message,
    });
    throw new Error(error.message || "Failed to initiate Google sign-in redirect");
  }
};

/**
 * Reads the redirect result after returning from Google sign-in.
 * Only relevant when signInWithGoogleRedirect was used as fallback.
 */
export const getGoogleRedirectResult = async () => {
  if (!auth) throw new Error(FIREBASE_NOT_CONFIGURED);
  const startTime = Date.now();
  console.log("[AUTH:REDIRECT_RESULT] Calling getRedirectResult()...", {
    currentUrl: window.location.href,
    hasCurrentUserBeforeCall: !!auth.currentUser,
    timestamp: new Date().toISOString(),
  });
  try {
    if (typeof (auth as any).authStateReady === "function") {
      await (auth as any).authStateReady();
    }

    const result = await getRedirectResult(auth);
    const elapsed = Date.now() - startTime;
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      console.log("[AUTH:REDIRECT_RESULT] SUCCESS — user received from redirect", {
        uid: result.user.uid?.substring(0, 8) + "...",
        email: result.user.email?.substring(0, 3) + "...",
        hasPhotoURL: !!result.user.photoURL,
        hasAccessToken: !!credential?.accessToken,
        elapsedMs: elapsed,
      });
      return result.user;
    }
    console.log("[AUTH:REDIRECT_RESULT] No result (normal on non-redirect loads)", {
      elapsedMs: elapsed,
      hasCurrentUserAfterCall: !!auth.currentUser,
    });
    return null;
  } catch (error: any) {
    const errorCode = error.code || "unknown";
    console.error("[AUTH:REDIRECT_RESULT] Error:", {
      code: errorCode,
      message: error.message,
      elapsedMs: Date.now() - startTime,
    });
    if (errorCode === 'auth/unauthorized-domain') {
      console.error("[AUTH:REDIRECT_RESULT] Add this domain to Firebase Console → Authentication → Authorized Domains:", window.location.hostname);
    }
    throw new Error(error.message || "Error getting Google sign-in result");
  }
};

export const signOut = async () => {
  if (!auth) throw new Error(FIREBASE_NOT_CONFIGURED);
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  if (!storage) throw new Error(FIREBASE_NOT_CONFIGURED);
  try {
    const storageRef = ref(storage, `profile_pictures/${userId}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

export { auth, storage, app };
