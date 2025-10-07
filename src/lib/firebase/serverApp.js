// enforce that this module is only usable on the server runtime
// Link: Next.js docs about keeping server-only code out of client bundles
import "server-only"; // import side-effect that restricts usage to server

// import helper to read cookies from the incoming request headers
import { cookies } from "next/headers"; // used to access request cookies
// import functions to initialize Firebase apps in server environments
import { initializeServerApp, initializeApp } from "firebase/app"; // Firebase SDK core imports

// import the Auth API to get the authenticated user from the Firebase app
import { getAuth } from "firebase/auth"; // Firebase Auth functions

// Function: return an authenticated Firebase app + current user for SSR/SSG
export async function getAuthenticatedAppForUser() {
  // read the '__session' cookie value (contains the user's ID token)
  const authIdToken = (await cookies()).get("__session")?.value; // may be undefined

  // initialize a server-scoped Firebase App using the client-provided token
  // note: initializeServerApp wraps a regular app with server-specific behavior
  const firebaseServerApp = initializeServerApp(
    // create a default Firebase App instance (no config required here)
    // reference: firebase-js-sdk issue discussion about this pattern
    initializeApp(),
    {
      // pass the user's auth ID token so server SDK can act on behalf of that user
      authIdToken,
    }
  );

  // obtain the Auth instance bound to the server Firebase App
  const auth = getAuth(firebaseServerApp); // get Auth for server-scoped app
  // wait for the SDK to populate the authenticated state (user info)
  await auth.authStateReady(); // ensures auth.currentUser is available

  // return the server app and the currently authenticated user (if any)
  return { firebaseServerApp, currentUser: auth.currentUser };
}