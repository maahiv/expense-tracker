import React, { useState } from "react";
import { useSelector } from "react-redux";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Welcome from "./components/Welcome";

function App() {
  const [screen, setScreen] = useState("login");

  const isAuthenticated = useSelector(
    (state) => state.auth.isAuthenticated
  );

  if (isAuthenticated) {
    return <Welcome />;
  }

  if (screen === "signup") {
    return (
      <Signup
        onLogin={() => setScreen("login")}
      />
    );
  }

  return (
    <Login
      onSignup={() => setScreen("signup")}
    />
  );
}

export default App;