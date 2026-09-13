import React, { useState } from "react";
import AuthLayout from "./AuthLayout";

import { useDispatch } from "react-redux";
import { login } from "../redux/authSlice";


export default function Login({ onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const user = await loginUser(email.trim(), password);

      const token = await user.getIdToken(true);

      dispatch(
        login({
          token,
          userId: user.uid,
        })
      );
    } catch (err) {
      if (
        [
          "auth/invalid-credential",
          "auth/wrong-password",
          "auth/user-not-found",
        ].includes(err.code)
      ) {
        alert("Invalid email or password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        alert("Please enter a valid email address.");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout type="login">
      <div className="card">
        <h1>Login</h1>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={!email.trim() || !password || loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <a
            className="forgot-password"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            Forgot password
          </a>
        </form>
      </div>

      <button
        className="login-box"
        type="button"
        onClick={onSignup}
      >
        Don't have an account? Sign up
      </button>
    </AuthLayout>
  );
}