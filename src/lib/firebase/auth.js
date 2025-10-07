// import Firebase Auth helpers used by the client-side auth wrapper
import {
  // provider class for Google OAuth sign-in
  GoogleAuthProvider,
  // helper to open a popup for OAuth sign-in
  signInWithPopup,
  // rename the low-level listener helpers so we can wrap them
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
} from "firebase/auth";

// import the initialized client-side Auth instance
import { auth } from "@/src/lib/firebase/clientApp";

// wrapper: listens for changes to the user's auth state and forwards the callback
export function onAuthStateChanged(cb) {
  return _onAuthStateChanged(auth, cb);
}

// wrapper: listens for changes to the ID token and forwards the callback
export function onIdTokenChanged(cb) {
  return _onIdTokenChanged(auth, cb);
}

// perform Google sign-in using a popup and handle any errors
export async function signInWithGoogle() {
  // create a Google OAuth provider instance
  const provider = new GoogleAuthProvider();

  try {
    // trigger the popup sign-in flow using the shared auth instance
    await signInWithPopup(auth, provider);
  } catch (error) {
    // log detailed errors to help debugging sign-in issues
    console.error("Error signing in with Google", error);
  }
}

// sign the current user out and report any errors
export async function signOut() {
  try {
    // call the signOut method on the Auth instance
    return auth.signOut();
  } catch (error) {
    // log the error if sign-out fails
    console.error("Error signing out with Google", error);
  }
}