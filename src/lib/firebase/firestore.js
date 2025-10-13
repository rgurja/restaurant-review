// import helper which generates fake restaurants and reviews for testing
import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js"; // helper to create demo data

// import Firestore functions used throughout this module
import {
  // get a collection reference
  collection,
  // listen for realtime updates
  onSnapshot,
  // build Firestore queries
  query,
  // execute a query and return documents
  getDocs,
  // get a document reference
  doc,
  // fetch a single document
  getDoc,
  // update an existing document
  updateDoc,
  // order query results
  orderBy,
  // Firestore timestamp type (used below to construct timestamps)
  Timestamp,
  // run a transaction
  runTransaction,
  // add where filters to queries
  where,
  // add a new document
  addDoc,
  // get a Firestore instance (not used directly here)
  getFirestore,
} from "firebase/firestore";

// import the client-side Firestore database instance
import { db } from "@/src/lib/firebase/clientApp"; // application's Firestore client

// update the photo URL field for a restaurant document
export async function updateRestaurantImageReference(
  // the id of the restaurant document to update
  restaurantId,
  // the public URL of the uploaded image
  publicImageUrl
) {
  // build a reference to the document inside the 'restaurants' collection
  const restaurantRef = doc(collection(db, "restaurants"), restaurantId);
  // if a reference was successfully created, update the 'photo' field
  if (restaurantRef) {
    await updateDoc(restaurantRef, { photo: publicImageUrl });
  }
}

// helper to update rating totals inside a transaction and add the review document
const updateWithRating = async (
  transaction,
  docRef,
  newRatingDocument,
  review
) => {
  // read the restaurant document inside the transaction
  const restaurant = await transaction.get(docRef);
  const data = restaurant.data(); // existing data for the restaurant
  // compute the new number of ratings (increment or set to 1)
  const newNumRatings = data?.numRatings ? data.numRatings + 1 : 1;
  // compute the new sum of ratings
  const newSumRating = (data?.sumRating || 0) + Number(review.rating);
  // compute the new average rating
  const newAverage = newSumRating / newNumRatings;

  // update the restaurant totals in the transaction
  transaction.update(docRef, {
    numRatings: newNumRatings,
    sumRating: newSumRating,
    avgRating: newAverage,
  });

  // add the review document into the ratings subcollection with a timestamp
  transaction.set(newRatingDocument, {
    ...review,
    timestamp: Timestamp.fromDate(new Date()),
  });
};

// add a review to a restaurant using a transaction to update totals and create the rating doc
export async function addReviewToRestaurant(db, restaurantId, review) {
        if (!restaurantId) {
                throw new Error("No restaurant ID has been provided.");
        }

        if (!review) {
                throw new Error("A valid review has not been provided.");
        }

        try {
                // build a reference to the restaurant document
                const docRef = doc(collection(db, "restaurants"), restaurantId);
                // prepare a new document reference inside the ratings subcollection
                const newRatingDocument = doc(
                        collection(db, `restaurants/${restaurantId}/ratings`)
                );

                // run the transaction which updates totals and writes the review
                await runTransaction(db, transaction =>
                        updateWithRating(transaction, docRef, newRatingDocument, review)
                );
        } catch (error) {
                console.error(
                        "There was an error adding the rating to the restaurant",
                        error
                );
                throw error;
        }
}

// apply simple query filters (category, city, price, sort) to a base query
function applyQueryFilters(q, { category, city, price, sort }) {
  // limit to a specific category when provided
  if (category) {
    q = query(q, where("category", "==", category));
  }
  // limit to a specific city when provided
  if (city) {
    q = query(q, where("city", "==", city));
  }
  // filter by price using the length of the price string (existing code expects price to be like '$$')
  if (price) {
    q = query(q, where("price", "==", price.length));
  }
  // default sorting is by average rating descending
  if (sort === "Rating" || !sort) {
    q = query(q, orderBy("avgRating", "desc"));
  } else if (sort === "Review") {
    // otherwise sort by number of ratings descending
    q = query(q, orderBy("numRatings", "desc"));
  }
  // return the modified query
  return q;
}

// fetch restaurants once (server-side) with optional filters
export async function getRestaurants(db = db, filters = {}) {
  // create a base query for the restaurants collection
  let q = query(collection(db, "restaurants"));

  // apply user-provided filters to the query
  q = applyQueryFilters(q, filters);
  // execute the query and get the matching documents
  const results = await getDocs(q);
  // map Firestore documents to plain objects suitable for client components
  return results.docs.map((doc) => {
    return {
      // include the document id
      id: doc.id,
      // spread the document data fields
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      // convert Firestore Timestamp to JS Date
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

// subscribe to realtime updates for restaurants with optional filters
export function getRestaurantsSnapshot(cb, filters = {}) {
  // ensure the callback provided is a function
  if (typeof cb !== "function") {
    console.log("Error: The callback parameter is not a function");
    return;
  }

  // build a base query for restaurants
  let q = query(collection(db, "restaurants"));
  // apply filters to the query
  q = applyQueryFilters(q, filters);

  // return the onSnapshot unsubscribe function and call the callback with mapped results
  return onSnapshot(q, (querySnapshot) => {
    // map documents to plain JS objects
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        timestamp: doc.data().timestamp.toDate(),
      };
    });

    // invoke the provided callback with the transformed results
    cb(results);
  });
}

// fetch a single restaurant by id
export async function getRestaurantById(db, restaurantId) {
  // validate the id argument
  if (!restaurantId) {
    console.log("Error: Invalid ID received: ", restaurantId);
    return;
  }
  // create a document reference for the restaurant
  const docRef = doc(db, "restaurants", restaurantId);
  // fetch the document snapshot
  const docSnap = await getDoc(docRef);
  // return the document data with the timestamp converted to a Date
  return {
    ...docSnap.data(),
    timestamp: docSnap.data().timestamp.toDate(),
  };
}

// placeholder for subscribing to a single restaurant document; not implemented
export function getRestaurantSnapshotById(restaurantId, cb) {
  // unimplemented: should set up onSnapshot for the single doc
  return;
}

// fetch reviews for a restaurant ordered by timestamp descending
export async function getReviewsByRestaurantId(db, restaurantId) {
  // validate the restaurant id
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  // build a query on the subcollection 'ratings' ordered newest first
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );

  // execute the query and map the docs to plain objects
  const results = await getDocs(q);
  return results.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

// subscribe to realtime updates of reviews for a restaurant
export function getReviewsSnapshotByRestaurantId(restaurantId, cb) {
  // validate the restaurant id
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  // query the ratings subcollection ordered by timestamp descending
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );
  // attach an onSnapshot listener and map snapshots to plain objects
  return onSnapshot(q, (querySnapshot) => {
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        timestamp: doc.data().timestamp.toDate(),
      };
    });
    // call the supplied callback with the transformed results
    cb(results);
  });
}

// generate and add fake restaurants and reviews to Firestore (for demo/test)
export async function addFakeRestaurantsAndReviews() {
  // generate the fake data using the helper
  const data = await generateFakeRestaurantsAndReviews();
  // iterate over each generated restaurant and its ratings
  for (const { restaurantData, ratingsData } of data) {
    try {
      // add the restaurant document to the 'restaurants' collection
      const docRef = await addDoc(
        collection(db, "restaurants"),
        restaurantData
      );

      // for each rating, add a subdocument under the restaurant's 'ratings' subcollection
      for (const ratingData of ratingsData) {
        await addDoc(
          collection(db, "restaurants", docRef.id, "ratings"),
          ratingData
        );
      }
    } catch (e) {
      // log a user-friendly message and the detailed error
      console.log("There was an error adding the document");
      console.error("Error adding document: ", e);
    }
  }
}
