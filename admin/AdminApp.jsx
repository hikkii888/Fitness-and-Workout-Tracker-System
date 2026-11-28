import { useEffect, useState } from 'react';
import { apiRequest } from '../src/api.js';
import Icon from '../src/pages/Icon.js';
import AdminDashboard from '../src/pages/AdminDashboard.js';

function AdminApp() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest('/auth/me')
      .then(({ user: sessionUser }) => {
        if (!active) return;
        setUser(sessionUser);
        if (sessionUser && !sessionUser.isAdmin) {
          setError('This account is not configured for admin access.');
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setStatus('ready');
      });
    return () => { active = false; };
  }, []);

  const signIn = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(result.user);
      if (!result.user.isAdmin) {
        setError('This account is not configured for admin access.');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    setError('');
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      setUser(null);
      setPassword('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="admin-standalone">
      <header className="admin-standalone-header">
        <div className="admin-standalone-brand">
          <span className="brand-mark"><Icon name="bolt" /></span>
          <strong>form<span className="brand-period">.</span></strong>
          <span className="admin-standalone-label">ADMIN</span>
        </div>
        {user?.isAdmin && (
          <div className="admin-standalone-account">
            <span>{user.name}</span>
            <button className="admin-signout" onClick={signOut} type="button">Sign out</button>
          </div>
        )}
      </header>

      <main className="admin-standalone-main">
        {status === 'checking' ? (
          <p className="history-loading admin-loading" role="status">Checking admin access…</p>
        ) : user?.isAdmin ? (
          <>
            {error && <p className="api-error" role="alert">{error}</p>}
            <AdminDashboard />
          </>
        ) : user ? (
          <section className="admin-access-card" aria-labelledby="admin-access-title">
            <p className="eyebrow">ADMIN ACCESS REQUIRED</p>
            <h1 id="admin-access-title">This account can’t open the admin portal.</h1>
            <p>Sign in with an account listed in the server’s <code>ADMIN_EMAILS</code> setting.</p>
            {error && <p className="api-error" role="alert">{error}</p>}
            <button className="primary-button" onClick={() => { setUser(null); setError(''); }} type="button">
              Use another account
            </button>
          </section>
        ) : (
          <section className="account-screen">
            <section className="account-card" aria-labelledby="admin-signin-title">
              <div className="account-brand">
                <span className="brand-mark"><Icon name="bolt" /></span>
                <span>form<span className="brand-period">.</span></span>
              </div>
              <p className="eyebrow">ADMINISTRATOR PORTAL</p>
              <h1 id="admin-signin-title">Sign in to manage Form.</h1>
              <p className="account-intro">Use an existing administrator account to continue.</p>
              <form className="account-form" onSubmit={signIn}>
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
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </label>
                {error && <p className="account-error" role="alert">{error}</p>}
                <button className="primary-button account-submit" disabled={submitting} type="submit">
                  {submitting ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminApp;
