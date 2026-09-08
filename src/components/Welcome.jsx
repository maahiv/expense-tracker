import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import React, { useState } from "react";

function Welcome({ onCompleteProfile }) {
  const [sending, setSending] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      localStorage.removeItem("expenseTrackerToken");
      window.location.reload();
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setSending(true);

      const user = auth.currentUser;

      if (!user) {
        alert("Please login again.");
        return;
      }

      const idToken = await user.getIdToken(true);
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
            idToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            "Unable to send verification email."
        );
      }

      alert(
        "Check your email. A verification link has been sent."
      );
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "Unable to send verification email."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="welcome-page">

    <button
  className="logout-button"
  onClick={handleLogout}
>
  Logout
</button>

      <div className="welcome-header">

        <h1>
          Welcome to Expense Tracker!!!
        </h1>

        <div className="profile-message">
          <span>
            Your Profile is <b>64%</b> completed.
            A complete Profile has higher chances of
            landing a job.
          </span>

          <button onClick={onCompleteProfile}>
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

    </div>
  );
}

export default Welcome;