"use client"; // Next.js client component directive - marks this component to be rendered on the client

// This component handles the review dialog and uses a Next.js Server Action for form submission

import { useEffect, useLayoutEffect, useRef } from "react"; // React hooks used in this component
import RatingPicker from "@/src/components/RatingPicker.jsx"; // child component for selecting a rating
import { handleReviewFormSubmission } from "@/src/app/actions.js"; // server action to handle the review form

const ReviewDialog = ({ // component definition and props destructuring
  isOpen, // boolean: whether the dialog should be open
  handleClose, // function: called to close the dialog
  review, // object: current review state (e.g., { text, rating })
  onChange, // function: called when local review state changes
  userId, // string: id of the current user
  id, // string: id of the restaurant being reviewed
}) => {
  const dialog = useRef(); // ref to the native <dialog> element

  // dialogs only render their backdrop when called with `showModal`
  useLayoutEffect(() => { // layout effect to synchronously open/close dialog when isOpen changes
    if (isOpen) { // if the prop says open
      dialog.current.showModal(); // call native showModal to display the dialog with backdrop
    } else { // otherwise
      dialog.current.close(); // close the dialog
    }
  }, [isOpen, dialog]); // re-run the effect when isOpen or the dialog ref changes

  const handleClick = (e) => { // click handler for the dialog backdrop
    // close if clicked outside the modal
    if (e.target === dialog.current) { // check that the click target is the dialog itself (backdrop)
      handleClose(); // invoke the provided close handler
    }
  };   

  return (
    <dialog ref={dialog} onMouseDown={handleClick}>
      {/* dialog element with ref and backdrop click handler */}
      <form action={handleReviewFormSubmission} onSubmit={() => { handleClose(); }}>
        {/* form submits to server action then closes dialog */}
        <header>
          {/* header section of the dialog */}
          <h3>
            {/* heading text */}
            Add your review
          </h3>
          {/* title for the dialog */}
        </header>
        {/* end header */}
        <article>
          {/* main content area for inputs and controls */}
          <RatingPicker />
          {/* rating picker component for choosing a star rating */}

          <p>
            {/* paragraph wrapper for text input */}
            <input
              type="text"
              name="text"
              id="review"
              placeholder="Write your thoughts here"
              required
              value={review.text}
              onChange={(e) => onChange(e.target.value, "text")}
            />
            {/* text input bound to review.text and onChange */}
          </p>
          {/* end paragraph */}

          <input type="hidden" name="restaurantId" value={id} />
          {/* hidden input carrying restaurant id */}
          <input type="hidden" name="userId" value={userId} />
          {/* hidden input carrying user id */}
        </article>
        {/* end article */}
        <footer>
          {/* footer with action buttons */}
          <menu>
            {/* menu wrapper for dialog actions */}
            <button
              autoFocus
              type="reset"
              onClick={handleClose}
              className="button--cancel"
            >
              {/* cancel/reset button */}
              Cancel
              {/* visible label for cancel button */}
            </button>
            {/* end cancel button */}
            <button type="submit" value="confirm" className="button--confirm">
              {/* submit button to send form */}
              Submit
              {/* visible label for submit button */}
            </button>
            {/* end submit button */}
          </menu>
          {/* end menu */}
        </footer>
        {/* end footer */}
      </form>
      {/* end form */}
  </dialog>
  );
}; // end ReviewDialog component

export default ReviewDialog; // export component as default
