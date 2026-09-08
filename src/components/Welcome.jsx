import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import React from "react";

function Welcome({ onCompleteProfile }) {

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