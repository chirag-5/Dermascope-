import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserShell from '../components/UserShell';
import GoogleLoginButton from '../components/GoogleLoginButton';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';

const UserLogin = () => {
  const navigate = useNavigate();
  const { user, loginUser, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user?.role === 'user') {
    return <Navigate to="/upload" replace />;
  }

  if (user?.role === 'dermatologist') {
    window.location.href = `${ADMIN_URL}/dashboard`;
    return null;
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await loginUser(form);
      navigate('/upload');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserShell>
      <h1>Sign In</h1>
      <p className="subtitle">
        DermaScope uses AI to highlight skin and hair concern areas, then helps you book a
        dermatologist.
      </p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn-user" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="oauth-divider">or</div>

      <GoogleLoginButton
        onSuccess={async (credential) => {
          await loginWithGoogle({ credential, role: 'user' });
          navigate('/upload');
        }}
      />

      <p className="link-row">
        No account? <Link to="/register">Register</Link>
      </p>

    </UserShell>
  );
};

export default UserLogin;
