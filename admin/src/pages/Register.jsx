import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PartnerShell from '../components/PartnerShell';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

const SPECIALTY_OPTIONS = [
  { value: 'skin', label: 'Skin concerns (acne, spots, blemishes)' },
  { value: 'hair', label: 'Hair concerns (thinning, hairline, bald spots)' },
];

const PartnerRegister = () => {
  const navigate = useNavigate();
  const { user, registerDermatologist } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    clinicName: '',
    password: '',
  });
  const [specialties, setSpecialties] = useState([]);
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

  const toggleSpecialty = (value) => {
    setSpecialties((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (specialties.length === 0) {
      setError('Select at least one specialty area');
      return;
    }

    setSubmitting(true);

    try {
      await registerDermatologist({ ...form, specialties });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PartnerShell>
      <h1>Join as Dermatologist</h1>
      <p className="subtitle">Quick setup — tell us about your practice</p>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Dr. Jane Smith"
            required
          />
        </div>

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
          <label htmlFor="clinicName">Clinic name</label>
          <input
            id="clinicName"
            name="clinicName"
            type="text"
            value={form.clinicName}
            onChange={handleChange}
            placeholder="Your clinic or practice name"
            required
          />
        </div>

        <fieldset className="form-group specialty-fieldset">
          <legend>Specialty areas</legend>
          <p className="fieldset-hint">Which concerns do you handle?</p>
          {SPECIALTY_OPTIONS.map((option) => (
            <label key={option.value} className="checkbox-label">
              <input
                type="checkbox"
                checked={specialties.includes(option.value)}
                onChange={() => toggleSpecialty(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            placeholder="Create your sign-in password"
            required
          />
          <p className="fieldset-hint">Minimum 6 characters — used to sign in to the doctor portal</p>
        </div>

        <button type="submit" className="btn-partner" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="link-row">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </PartnerShell>
  );
};

export default PartnerRegister;
