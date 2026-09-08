import { signOut, getIdToken } from "firebase/auth";
import { auth } from "../firebase";
import React, { useState } from "react";

function Welcome({ onCompleteProfile }) {
  const [sending, setSending] = useState(false);

  const handleVerifyEmail = async () => {
    try {
      setSending(true);

      const user = auth.currentUser;

      if (!user) {
        alert("Please login again.");
        return;
      }

      const idToken = await getIdToken(user, true);

      const apiKey = auth.app.options.apiKey;

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestType: "VERIFY_EMAIL",
            idToken: idToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data?.error?.message;

        const errorMessages = {
          EMAIL_NOT_FOUND: "Email account was not found.",
          INVALID_ID_TOKEN:
            "Your session has expired. Please login again.",
          USER_NOT_FOUND:
            "User account was not found.",
          TOO_MANY_ATTEMPTS_TRY_LATER:
            "Too many attempts. Please try again later.",
          OPERATION_NOT_ALLOWED:
            "Email verification is not enabled.",
        };

        throw new Error(
          errorMessages[errorCode] ||
            "Unable to send verification email. Please try again."
        );
      }

      alert(
        "Check your email. A verification link has been sent."
      );
    } catch (error) {
      console.error("Email verification error:", error);

      alert(
        error.message ||
          "Unable to send verification email. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);

    localStorage.removeItem("expenseTrackerToken");

    window.location.reload();
  };

  return (
    <div className="welcome-page">

      <div className="welcome-header">

        <h1>
          Welcome to Expense Tracker!!!
        </h1>

        <div className="profile-message">

          <span>
            Your Profile is <b>64%</b> completed.
            A complete Profile has higher chances of landing a job.
          </span>

          <button
            onClick={onCompleteProfile}
          >
            Complete now
          </button>

        </div>

        <div className="email-verification">

          <button
            onClick={handleVerifyEmail}
            disabled={sending}
          >
            {sending
              ? "Sending..."
              : "Verify Email ID"}
          </button>

        </div>

      </div>

      <button
        className="logout-button"
        onClick={handleLogout}
      >
        Logout
      </button>

    </div>
  );
}

export default Welcome;