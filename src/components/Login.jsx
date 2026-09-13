import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../redux/authSlice";

export default function Login({ onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();

  const handleLogin = (e) => {
    e.preventDefault();

    // Login form ki values matter nahi karti
    dispatch(login());
  };

  return (
    <div className="auth-page">
      <div className="card">
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            Login
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
    </div>
  );
}