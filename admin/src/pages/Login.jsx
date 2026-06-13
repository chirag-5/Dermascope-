import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PartnerShell from '../components/PartnerShell';
import GoogleLoginButton from '../components/GoogleLoginButton';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

const PartnerLogin = () => {
  const navigate = useNavigate();
  const { user, loginDermatologist, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user?.role === 'dermatologist') {
    return <Navigate to="/dashboard" replace />;
  }

  if (user?.role === 'user') {
    window.location.href = `${FRONTEND_URL}/upload`;
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
      await loginDermatologist(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PartnerShell>
      <h1>Dermatologist Login</h1>
      <p className="subtitle">Sign in to review patient bookings and analysis</p>

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

        <button type="submit" className="btn-partner" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign In to Doctor Portal'}
        </button>
      </form>

      <div className="oauth-divider">or</div>

      <GoogleLoginButton
        onSuccess={async (credential) => {
          await loginWithGoogle({ credential, role: 'dermatologist' });
          navigate('/dashboard');
        }}
      />

      <p className="link-row">
        New dermatologist? <Link to="/register">Register</Link>
      </p>
    </PartnerShell>
  );
};

export default PartnerLogin;
