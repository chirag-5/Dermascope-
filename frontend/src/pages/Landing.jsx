import { Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserShell from '../components/UserShell';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';

const highlights = [
  'AI-assisted skin and hair analysis',
  'Book a dermatologist from one place',
  'Track consultations and support chats',
];

const steps = [
  'Log in to access your personal portal.',
  'Upload a photo for AI review and annotated results.',
  'Choose a dermatologist and follow up in chat.',
];

const UserLanding = () => {
  const { user } = useAuth();

  if (user?.role === 'user') {
    return <Navigate to="/upload" replace />;
  }

  if (user?.role === 'dermatologist') {
    window.location.href = `${ADMIN_URL}/dashboard`;
    return null;
  }

  return (
    <UserShell size="wide">
      <section className="landing-hero">
        <span className="landing-kicker">User Portal</span>
        <h1>Welcome to your DermaScope home</h1>
        <p className="subtitle landing-subtitle">
          A simple place to start your skin analysis, review results, and continue to the main
          app.
        </p>

        <div className="landing-actions">
          <Link to="/login" className="landing-button landing-button-primary">
            Log In
          </Link>
          <Link to="/register" className="landing-button landing-button-secondary">
            Create Account
          </Link>
        </div>

        <div className="landing-highlights">
          {highlights.map((item) => (
            <div key={item} className="landing-card">
              {item}
            </div>
          ))}
        </div>

        <div className="landing-steps">
          {steps.map((step, index) => (
            <div key={step} className="landing-step">
              <span className="landing-step-number">0{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>

      </section>
    </UserShell>
  );
};

export default UserLanding;
