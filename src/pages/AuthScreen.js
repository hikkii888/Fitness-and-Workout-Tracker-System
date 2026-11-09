import { useState } from 'react';
import { apiRequest } from '../api';
import Icon from './Icon';

export default function AuthScreen({ mode, onModeChange, onAuthenticated }) {
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await apiRequest(`/auth/${isSignup ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      onAuthenticated(result.user);
    } catch (requestError) {
      setError(requestError instanceof TypeError
        ? 'Could not connect to the server. Please try again.'
        : requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="account-screen">
      <section className="account-card" aria-labelledby="account-title">
        <a className="account-brand" href="/" aria-label="Form home">
          <span className="brand-mark"><Icon name="bolt" /></span>
          <span>form<span className="brand-period">.</span></span>
        </a>
        <p className="eyebrow">{isSignup ? 'START YOUR JOURNEY' : 'WELCOME BACK'}</p>
        <h1 id="account-title">{isSignup ? 'Create your account' : 'Sign in to your account'}</h1>
        <p className="account-intro">
          {isSignup
            ? 'Save your goals and workouts in your own private account.'
            : 'Your goals, plans, and workout history are waiting for you.'}
        </p>
        <form className="account-form" onSubmit={submit}>
          {isSignup && (
            <label>
              Full name
              <input
                autoComplete="name"
                maxLength={100}
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
          )}
          <label>
            Email address
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              maxLength={128}
              minLength={isSignup ? 8 : undefined}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            {isSignup && <small>Use at least 8 characters.</small>}
          </label>
          {error && <p className="account-error" role="alert">{error}</p>}
          <button className="primary-button account-submit" disabled={submitting} type="submit">
            {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="account-switch">
          {isSignup ? 'Already have an account?' : 'New to Form?'}
          {' '}
          <button type="button" onClick={() => onModeChange(isSignup ? 'login' : 'signup')}>
            {isSignup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </section>
    </main>
  );
}
