import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  getIdToken
} from "firebase/auth";
import { auth } from "../firebase";

function Login({ onSignup, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const token = await getIdToken(userCredential.user);

      localStorage.setItem("expenseTrackerToken", token);

      onLoginSuccess();
    } catch (error) {
      console.log(error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        alert("Invalid email or password. Please try again.");
      } else if (error.code === "auth/invalid-email") {
        alert("Please enter a valid email address.");
      } else if (error.code === "auth/network-request-failed") {
        alert("Network error. Please check your internet connection.");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page login-screen">

      <div className="blue-shape"></div>

      <main className="auth-content">
        <div className="auth-card">

          <h1>Login</h1>

          <form onSubmit={handleLogin}>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={!email.trim() || !password || loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          <a href="#" className="forgot-password">
            Forgot password
          </a>

        </div>

        <button
          className="switch-button"
          onClick={onSignup}
        >
          Don't have an account? Sign up
        </button>

      </main>
    </div>
  );
}

export default Login;