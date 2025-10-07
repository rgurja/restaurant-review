// import the RestaurantListings client component used to render the list
import RestaurantListings from "@/src/components/RestaurantListings.jsx";
// import server-side helper to fetch restaurants from Firestore
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
// import a helper that returns a Firebase server app authenticated for the current user
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
// import getFirestore to obtain a Firestore instance from the server Firebase app
import { getFirestore } from "firebase/firestore";

// Force next.js to treat this route as server-side rendered
// Without this line, during the build process, next.js will treat this route as static and build a static HTML file for it
export const dynamic = "force-dynamic";

// This line also forces this route to be server-side rendered (commented out alternative)
// export const revalidate = 0;

// default exported page component for the home route (runs on the server)
export default async function Home(props) {
  // get search params that Next.js passes into the page for server-side rendering
  const searchParams = await props.searchParams;
  // Using searchParams which Next.js provides allows filtering on the server-side, e.g. ?city=London&category=Indian&sort=Review
  // get an authenticated server-scoped Firebase app for the incoming request
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // fetch restaurants from Firestore using the server app and the provided search params
  const restaurants = await getRestaurants(
    getFirestore(firebaseServerApp),
    searchParams
  );
  // render the page markup, passing initial restaurants and search params down to the listings component
  return (
    <main className="main__home">
      <RestaurantListings
        initialRestaurants={restaurants}
        searchParams={searchParams}
      />
    </main>
  );
}
