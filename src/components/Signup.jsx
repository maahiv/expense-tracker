import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from "../firebase";

function Signup({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      console.log("User has successfully signed up.");

      await signOut(auth);

      alert("Account created successfully. Please login.");

      setEmail("");
      setPassword("");
      setConfirmPassword("");

      onLogin();

    } catch (error) {
      console.log(error);

      if (error.code === "auth/email-already-in-use") {
        setError("An account already exists with this email.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page signup-screen">

      <div className="blue-shape"></div>

      <main className="auth-content">

        <div className="auth-card">

          <h1>SignUp</h1>

          <form onSubmit={handleSignup}>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                !email.trim() ||
                !password ||
                !confirmPassword ||
                loading
              }
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>

          </form>

        </div>

        <button
          className="switch-button"
          onClick={onLogin}
        >
          Have an account? Login
        </button>

      </main>
    </div>
  );
}

export default Signup;