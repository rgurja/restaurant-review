// import required functions from firebase/storage
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // create refs, upload and retrieve URLs

// import the initialized storage instance for the app
import { storage } from "@/src/lib/firebase/clientApp"; // configured Firebase Storage client

// import helper to update restaurant document with the image URL
import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore"; // updates Firestore doc with the new image URL

// public API: upload an image and update Firestore with the returned public URL
export async function updateRestaurantImage(restaurantId, image) {
  try {
    // validate restaurant id
    if (!restaurantId) {
      throw new Error("No restaurant ID has been provided.");
    }

    // validate image object and filename
    if (!image || !image.name) {
      throw new Error("A valid image has not been provided.");
    }

    // upload the image and get back a public URL
    const publicImageUrl = await uploadImage(restaurantId, image);
    // update the restaurant document to reference the uploaded image
    await updateRestaurantImageReference(restaurantId, publicImageUrl);

    // return the public URL so callers can use it immediately
    return publicImageUrl;
  } catch (error) {
    // log errors for debugging; function intentionally doesn't rethrow so callers can handle undefined
    console.error("Error processing request:", error);
  }
}

// internal helper: upload bytes to storage and return the public download URL
async function uploadImage(restaurantId, image) {
  // build a deterministic file path for the uploaded image
  const filePath = `images/${restaurantId}/${image.name}`;
  // create a storage reference at that file path
  const newImageRef = ref(storage, filePath);
  // upload the file using a resumable upload (good for larger files / network issues)
  await uploadBytesResumable(newImageRef, image);

  // return the publicly accessible download URL for the uploaded file
  return await getDownloadURL(newImageRef);
}
