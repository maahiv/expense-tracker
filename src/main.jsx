import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import './style.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isFormComplete =
    email.trim() !== '' && password !== '' && confirmPassword !== '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!isFormComplete) {
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
      setSuccess('Account created successfully!');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('An account already exists with this email.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection.');
          break;
        case 'auth/operation-not-allowed':
          setError('Email/password sign-up is not enabled in Firebase.');
          break;
        default:
          setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="navbar">
        <a className="brand" href="#" aria-label="MyWebLink home">
          <span className="brand-icon" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="brand-text">MyWebLink</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#">Home</a>
          <a href="#">Products</a>
          <a href="#">About Us</a>
        </nav>
      </header>

      <div className="blue-shape" aria-hidden="true" />

      <main className="content">
        <section className="signup-area" aria-label="Signup form">
          <div className="signup-card">
            <h1>SignUp</h1>

            <form onSubmit={handleSubmit} noValidate>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                aria-label="Email"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                aria-label="Password"
                required
              />

              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                aria-label="Confirm Password"
                required
              />

              {error && <p className="message error">{error}</p>}
              {success && <p className="message success">{success}</p>}

              <button
                className="signup-button"
                type="submit"
                disabled={!isFormComplete || loading}
              >
                {loading ? 'Signing up...' : 'Sign up'}
              </button>
            </form>
          </div>

          <button
            className="login-box"
            type="button"
            onClick={() => setError('Login screen is available for registered users.')}
          >
            Have an account? Login
          </button>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
