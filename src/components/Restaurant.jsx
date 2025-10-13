"use client"; // Next.js client component directive - this component runs on the client

// This component shows one individual restaurant
// It receives data from src/app/restaurant/[id]/page.jsx

import { React, useState, useEffect, Suspense } from "react"; // React imports and hooks
import dynamic from "next/dynamic"; // Next.js dynamic import helper
import { getRestaurantSnapshotById } from "@/src/lib/firebase/firestore.js"; // firestore helper to subscribe to restaurant updates
import { useUser } from "@/src/lib/getUser"; // hook to get current user
import RestaurantDetails from "@/src/components/RestaurantDetails.jsx"; // component that renders restaurant UI
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js"; // helper to upload/update restaurant images

const ReviewDialog = dynamic(() => import("@/src/components/ReviewDialog.jsx")); // lazily load ReviewDialog for client-side only

export default function Restaurant({ // main component function and props
  id, // restaurant id (string)
  initialRestaurant, // initial restaurant data passed from server
  initialUserId, // initial user id passed from server-side rendering
  children, // any nested children to render inside RestaurantDetails
}) {
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant); // local state for restaurant details
  const [isOpen, setIsOpen] = useState(false); // whether the review dialog is open

  // The only reason this component needs to know the user ID is to associate a review with the user, and to know whether to show the review dialog
  const userId = useUser()?.uid || initialUserId; // prefer client-side user id, fallback to initialUserId
  const [review, setReview] = useState({ // local state for the review being created/edited
    rating: 0, // numeric rating
    text: "", // review text
  });

  const onChange = (value, name) => { // handler to update review fields
    setReview({ ...review, [name]: value }); // shallow merge updated field into review state
  };

  async function handleRestaurantImage(target) { // handler when a new restaurant image is selected
    const image = target.files ? target.files[0] : null; // grab first file if present
    if (!image) { // if no file provided
      return; // nothing to do
    }

    const imageURL = await updateRestaurantImage(id, image); // upload and get back the URL
    setRestaurantDetails({ ...restaurantDetails, photo: imageURL }); // update restaurant state with new photo URL
  }

  const handleClose = () => { // close the review dialog and reset local review state
    setIsOpen(false); // close dialog
    setReview({ rating: 0, text: "" }); // reset review
  };

  useEffect(() => { // subscribe to realtime restaurant updates when the id changes
    return getRestaurantSnapshotById(id, (data) => {
      setRestaurantDetails(data); // update state when snapshot changes
    });
  }, [id]); // re-subscribe when id changes

  return (
    <>
      <RestaurantDetails
        restaurant={restaurantDetails} // pass current restaurant data
        userId={userId} // pass current userId
        handleRestaurantImage={handleRestaurantImage} // pass image upload handler
        setIsOpen={setIsOpen} // allow RestaurantDetails to open the review dialog
        isOpen={isOpen} // pass current open state
      >
        {children} {/* render any nested children inside RestaurantDetails */}
      </RestaurantDetails>
      {userId && (
        <Suspense fallback={<p>Loading...</p>}>
          <ReviewDialog
            isOpen={isOpen} // whether dialog should be shown
            handleClose={handleClose} // function to close dialog
            review={review} // current review state
            onChange={onChange} // handler to update review
            userId={userId} // current user id
            id={id} // restaurant id
          />
        </Suspense>
      )}
    </>
  );
}
