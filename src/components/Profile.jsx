import React, { useEffect, useState } from "react";

import {
  getIdToken,
  onAuthStateChanged
} from "firebase/auth";

import { auth } from "../firebase";

function Profile({ onCancel, onUpdated }) {
  const [fullName, setFullName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Get a fresh Firebase ID token
  const getFreshIdToken = async () => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User is not logged in.");
    }

    const token = await getIdToken(user, true);

    localStorage.setItem(
      "expenseTrackerToken",
      token
    );

    return token;
  };

  // Load existing profile data from Firebase
  useEffect(() => {
    let unsubscribe;

    const loadProfile = async () => {
      try {
        // Wait for Firebase to restore the logged-in user
        const user = await new Promise((resolve) => {
          unsubscribe = onAuthStateChanged(
            auth,
            (currentUser) => {
              resolve(currentUser);
            }
          );
        });

        if (!user) {
          throw new Error("User is not logged in.");
        }

        // Get fresh token
        const idToken = await getIdToken(
          user,
          true
        );

        localStorage.setItem(
          "expenseTrackerToken",
          idToken
        );

        const apiKey = auth.app.options.apiKey;

        const response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              idToken: idToken
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error?.message ||
              "Unable to fetch profile."
          );
        }

        const userData = data?.users?.[0];

        if (userData) {
          setFullName(
            userData.displayName || ""
          );

          setProfilePhoto(
            userData.photoUrl || ""
          );
        }
      } catch (error) {
        console.error(
          "Error fetching profile:",
          error
        );

        alert(
          error.message ||
            "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (
      !fullName.trim() ||
      !profilePhoto.trim()
    ) {
      alert("Please fill all profile details.");
      return;
    }

    setUpdating(true);

    try {
      // Get fresh token before updating
      const idToken = await getFreshIdToken();

      const apiKey = auth.app.options.apiKey;

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            idToken: idToken,
            displayName: fullName.trim(),
            photoUrl: profilePhoto.trim(),
            returnSecureToken: true
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            "Unable to update profile."
        );
      }

      // Save new token returned by Firebase
      if (data.idToken) {
        localStorage.setItem(
          "expenseTrackerToken",
          data.idToken
        );
      }

      alert("Profile updated successfully.");

      onUpdated();
    } catch (error) {
      console.error(
        "Error updating profile:",
        error
      );

      alert(
        error.message ||
          "Unable to update profile. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-content">
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-top">
        <h1>
          Winners never quit, Quitters never win.
        </h1>

        <div className="profile-status">
          Your Profile is <b>64%</b> completed.
          A complete Profile has higher chances
          of landing a job.
          <span>Complete now</span>
        </div>
      </div>

      <button
        className="cancel-btn"
        onClick={onCancel}
      >
        Cancel
      </button>

      <main className="profile-content">
        <h2>Contact Details</h2>

        <form
          className="profile-form"
          onSubmit={handleUpdate}
        >
          <div className="profile-field">
            <label>
              ◉ &nbsp; Full Name:
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
            />
          </div>

          <div className="profile-field">
            <label>
              ◉ &nbsp; Profile Photo URL
            </label>

            <input
              type="url"
              value={profilePhoto}
              onChange={(e) =>
                setProfilePhoto(e.target.value)
              }
            />
          </div>

          <button
            className="update-btn"
            type="submit"
            disabled={
              !fullName.trim() ||
              !profilePhoto.trim() ||
              updating
            }
          >
            {updating
              ? "Updating..."
              : "Update"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Profile;