import React from "react";

export default function AuthLayout({ children, type }) {
  return (
    <div className="auth-page">
      <div className="auth-container">
        {children}
      </div>
    </div>
  );
}