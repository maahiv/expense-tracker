import React, { useState } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Welcome from "./components/Welcome";
import Profile from "./components/Profile";
import ForgotPassword from "./components/ForgotPassword";

function App() {
  const [screen, setScreen] = useState(
    localStorage.getItem("expenseTrackerToken")
      ? "welcome"
      : "login"
  );

  if (screen === "forgot-password") {
  return (
    <ForgotPassword
      onBackToLogin={() => setScreen("login")}
    />
  );
}

  if (screen === "login") {
    return (
      <Login
  onSignup={() => setScreen("signup")}
  onLoginSuccess={() => setScreen("welcome")}
  onForgotPassword={() => setScreen("forgot-password")}
/>
    );
  }

  if (screen === "signup") {
    return (
      <Signup
        onLogin={() => setScreen("login")}
      />
    );
  }

  if (screen === "profile") {
    return (
      <Profile
        onCancel={() => setScreen("welcome")}
        onUpdated={() => setScreen("welcome")}
      />
    );
  }

  return (
    <Welcome
      onCompleteProfile={() => setScreen("profile")}
    />
  );
}

export default App;