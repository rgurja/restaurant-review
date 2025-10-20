// import model and plugin helpers from genkit/googleai
import { gemini20Flash, googleAI } from "@genkit-ai/googleai"; // model & plugin exports
import { genkit } from "genkit"; // genkit factory for LLM usage
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js"; // helper to fetch reviews
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp"; // server-side auth helper
import { getFirestore } from "firebase/firestore"; // to obtain a Firestore instance from the server app

// Server component that summarizes reviews using Gemini via Genkit
export async function GeminiSummary({ restaurantId }) { // server component entry, accepts restaurantId prop
  // get a server-authenticated Firebase app instance for the current user
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // firebaseServerApp is the admin-authenticated app for this request
  // fetch the reviews for the restaurant from Firestore
  const reviews = await getReviewsByRestaurantId(
    getFirestore(firebaseServerApp),
    restaurantId
  );
  // reviews is now an array of review objects from Firestore

  // choose a simple separator to join reviews (keeps them distinct)
  const reviewSeparator = "@"; // delimiter used to separate reviews in the prompt
  // craft a simple prompt that includes all review text separated by the chosen delimiter
  const prompt = `
    Based on the following restaurant reviews, 
    where each review is separated by a '${reviewSeparator}' character, 
    create a one-sentence summary of what people think of the restaurant. 

    Here are the reviews: ${reviews.map((review) => review.text).join(reviewSeparator)}
  `;
  // prompt is a template literal containing all review texts joined by the separator

  try { // attempt to call Genkit/Gemini to summarize the reviews
    // validate that the GEMINI_API_KEY secret is available in the environment
  if (!process.env.GEMINI_API_KEY) { // ensure the API key secret is present
      // Make sure GEMINI_API_KEY environment variable is set:
      // https://firebase.google.com/docs/genkit/get-started
      throw new Error(
        'GEMINI_API_KEY not set. Set it with "firebase apphosting:secrets:set GEMINI_API_KEY"'
      ); // throw a helpful error when the secret is missing
    }

    // Configure a Genkit instance with the googleAI plugin and default model
    const ai = genkit({  // create a genkit client configured with Google AI
      plugins: [googleAI()], // attach googleAI plugin
      model: gemini20Flash, // set default model
    });
    // generate a response from the model using the prompt
    const { text } = await ai.generate(prompt);
    // text contains the one-sentence summary returned by the model

    // render the summary and a small attribution note
    return (
      <div className="restaurant__review_summary">{/* wrapper for the summary */}
        {/* rendered summary text from the AI */}
        <p>{text}</p>
        {/* attribution note */}
        <p>✨ Summarized with Gemini</p>
      </div>
    );
  } catch (e) {
    // log the error server-side and return a simple error message to the client
    console.error(e);
    return <p>Error summarizing reviews.</p>; // show generic error to client
  }
}

// Skeleton component shown while the GeminiSummary server component is loading
export function GeminiSummarySkeleton() { // placeholder shown while summary is being generated
  return (
    <div className="restaurant__review_summary"> {/* skeleton wrapper */}
      {/* placeholder text while waiting for the server component */}
      <p>✨ Summarizing reviews with Gemini...</p>
    </div>
  );
}
