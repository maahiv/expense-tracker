
import React, { useState } from "react";
import { auth } from "../firebase";

function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter your email address.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const apiKey = auth.app.options.apiKey;

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestType: "PASSWORD_RESET",
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data?.error?.message;

        const errorMessages = {
          EMAIL_NOT_FOUND:
            "No account exists with this email address.",

          INVALID_EMAIL:
            "Please enter a valid email address.",

          USER_DISABLED:
            "This user account has been disabled.",

          OPERATION_NOT_ALLOWED:
            "Password reset is not enabled for this project.",

          TOO_MANY_ATTEMPTS_TRY_LATER:
            "Too many attempts. Please try again later.",
        };

        throw new Error(
          errorMessages[errorCode] ||
            "Unable to send password reset email. Please try again."
        );
      }

      setMessage(
        "Password reset link has been sent to your email. Please check your inbox."
      );
    } catch (error) {
      console.error("Password reset error:", error);

      alert(
        error.message ||
          "Unable to send password reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        <h1>Forgot Password</h1>

        <p>
          Enter your registered email address and we will
          send you a password reset link.
        </p>

        <form onSubmit={handleResetPassword}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={!email.trim() || loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p className="reset-success">
            {message}
          </p>
        )}

        <button
          className="back-login-button"
          onClick={onBackToLogin}
          disabled={loading}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;

