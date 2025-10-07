"use client"; // mark this module as a client component for Next.js runtime
// import React and the useEffect hook for client-side behavior
import React, { useEffect } from "react";
// import Link for client-side navigation
import Link from "next/link";
// import auth helpers from our firebase wrapper
import {
  signInWithGoogle,
  signOut,
  onIdTokenChanged,
} from "@/src/lib/firebase/auth.js";
// import helper to seed fake data into Firestore (used by a menu action)
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";
// cookie helpers to persist the session token on the client
import { setCookie, deleteCookie } from "cookies-next";

// custom hook: keep the initial user session in sync with ID token changes
function useUserSession(initialUser) {
  // subscribe to id token changes when the component mounts
  useEffect(() => {
    // return the unsubscribe function from onIdTokenChanged
    return onIdTokenChanged(async (user) => {
      // if a user is present, get their ID token and persist it in a cookie
      if (user) {
        const idToken = await user.getIdToken();
        await setCookie("__session", idToken);
      } else {
        // if no user, remove the session cookie
        await deleteCookie("__session");
      }
      // if the initial user is the same as the new user, do nothing
      if (initialUser?.uid === user?.uid) {
        return;
      }
      // otherwise reload the page to let the server read the updated cookie
      window.location.reload();
    });
  }, [initialUser]);

  // return the initially provided user (the hook doesn't derive new state here)
  return initialUser;
}

// Header component: displays logo, sign-in/out, and the profile menu
export default function Header({ initialUser }) {
  // derive the user session using the custom hook
  const user = useUserSession(initialUser);

  // sign-out click handler: prevent navigation and call signOut()
  const handleSignOut = (event) => {
    event.preventDefault();
    signOut();
  };

  // sign-in click handler: prevent navigation and start Google sign-in
  const handleSignIn = (event) => {
    event.preventDefault();
    signInWithGoogle();
  };

  // render the header markup; use JSX comments between elements to document lines
  return (
    <header>
      {/* Logo link that navigates back to the home page */}
      <Link href="/" className="logo">
        {/* logo image */}
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        {/* brand text */}
        Friendly Eats
      </Link>
      {/* if a user is signed in show profile and menu, otherwise show sign-in link */}
      {user ? (
        <>
          {/* profile container when user is signed in */}
          <div className="profile">
            <p>
              {/* user's profile image (fallback to placeholder) */}
              <img
                className="profileImage"
                src={user.photoURL || "/profile.svg"}
                alt={user.email}
              />
              {/* user's display name */}
              {user.displayName}
            </p>

            {/* dropdown menu for profile actions */}
            <div className="menu">
              {/* placeholder for an icon or similar */}
              ...
              <ul>
                {/* show the user's display name in the menu */}
                <li>{user.displayName}</li>

                <li>
                  {/* link that seeds sample restaurants/reviews when clicked */}
                  <a href="#" onClick={addFakeRestaurantsAndReviews}>
                    Add sample restaurants
                  </a>
                </li>

                <li>
                  {/* link that triggers sign out when clicked */}
                  <a href="#" onClick={handleSignOut}>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        // when no user, show a sign-in call to action
        <div className="profile">
          <a href="#" onClick={handleSignIn}>
            {/* placeholder profile image for non-signed-in users */}
            <img src="/profile.svg" alt="A placeholder user image" />
            {/* sign-in label */}
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  );
}
