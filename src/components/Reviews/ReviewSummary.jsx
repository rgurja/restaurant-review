// import model and plugin helpers from genkit/googleai
import { gemini20Flash, googleAI } from "@genkit-ai/googleai"; // model & plugin exports
import { genkit } from "genkit"; // genkit factory for LLM usage
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js"; // helper to fetch reviews
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp"; // server-side auth helper
import { getFirestore } from "firebase/firestore"; // to obtain a Firestore instance from the server app

// Server component that summarizes reviews using Gemini via Genkit
export async function GeminiSummary({ restaurantId }) {
  // get a server-authenticated Firebase app instance for the current user
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // fetch the reviews for the restaurant from Firestore
  const reviews = await getReviewsByRestaurantId(
    getFirestore(firebaseServerApp),
    restaurantId
  );

  // choose a simple separator to join reviews (keeps them distinct)
  const reviewSeparator = "@";
  // craft a simple prompt that includes all review text separated by the chosen delimiter
  const prompt = `
    Based on the following restaurant reviews, 
    where each review is separated by a '${reviewSeparator}' character, 
    create a one-sentence summary of what people think of the restaurant. 

    Here are the reviews: ${reviews.map((review) => review.text).join(reviewSeparator)}
  `;

  try {
    // validate that the GEMINI_API_KEY secret is available in the environment
    if (!process.env.GEMINI_API_KEY) {
      // Make sure GEMINI_API_KEY environment variable is set:
      // https://firebase.google.com/docs/genkit/get-started
      throw new Error(
        'GEMINI_API_KEY not set. Set it with "firebase apphosting:secrets:set GEMINI_API_KEY"'
      );
    }

    // Configure a Genkit instance with the googleAI plugin and default model
    const ai = genkit({
      plugins: [googleAI()],
      model: gemini20Flash, // set default model
    });
    // generate a response from the model using the prompt
    const { text } = await ai.generate(prompt);

    // render the summary and a small attribution note
    return (
      <div className="restaurant__review_summary">
        <p>{text}</p>
        <p>✨ Summarized with Gemini</p>
      </div>
    );
  } catch (e) {
    // log the error server-side and return a simple error message to the client
    console.error(e);
    return <p>Error summarizing reviews.</p>;
  }
}

// Skeleton component shown while the GeminiSummary server component is loading
export function GeminiSummarySkeleton() {
  return (
    <div className="restaurant__review_summary">
      <p>✨ Summarizing reviews with Gemini...</p>
    </div>
  );
}
