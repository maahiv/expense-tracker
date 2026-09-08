import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createUserWithEmailAndPassword,
  getIdToken,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from './firebase';
import './style.css';

const TOKEN_KEY = 'expenseTrackerToken';

function App() {
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) setScreen('welcome');
  }, []);

  const clearMessages = () => setError('');

  const handleSignup = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      console.log('User has successfully signed up.');
      await signOut(auth);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      alert('Account created successfully. Please login to continue.');
      setScreen('login');
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'An account already exists with this email.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.'
      };
      setError(messages[err.code] || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      alert('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await getIdToken(credential.user);
      localStorage.setItem(TOKEN_KEY, token);
      setEmail('');
      setPassword('');
      setScreen('welcome');
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        alert('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        alert('Please enter a valid email address.');
      } else if (err.code === 'auth/network-request-failed') {
        alert('Network error. Please check your internet connection.');
      } else {
        alert('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem(TOKEN_KEY);
    setScreen('login');
    setEmail('');
    setPassword('');
  };

  const isSignup = screen === 'signup';

  if (screen === 'welcome') {
    return (
      <div className="welcome-page">
        <h1>Welcome to Expense Tracker!!!</h1>
        <button className="welcome-logout" onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  const canSubmit = isSignup
    ? email.trim() && password && confirmPassword
    : email.trim() && password;

  return (
    <div className={`page ${isSignup ? 'signup-screen' : 'login-screen'}`}>
      <header className="navbar">
        <div className="brand"><span className="brand-mark">◈</span><span>MyWebLink</span></div>
        <nav><a href="#">Home</a><a href="#">Products</a><a href="#">About Us</a></nav>
      </header>

      <div className="blue-shape" aria-hidden="true"></div>

      <main className="content">
        <section className="auth-wrap">
          <div className="card">
            <h1>{isSignup ? 'SignUp' : 'Login'}</h1>
            <form onSubmit={isSignup ? handleSignup : handleLogin} noValidate>
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
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              {isSignup && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              )}
              {error && <p className="message error">{error}</p>}
              <button type="submit" disabled={!canSubmit || loading}>
                {loading ? (isSignup ? 'Signing up...' : 'Logging in...') : (isSignup ? 'Sign up' : 'Login')}
              </button>
            </form>
          </div>

          <button
            className="login-box"
            type="button"
            onClick={() => { clearMessages(); setScreen(isSignup ? 'login' : 'signup'); }}
          >
            {isSignup ? 'Have an account? Login' : "Don't have an account? Sign up"}
          </button>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
