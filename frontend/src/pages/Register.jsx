import { useState } from 'react';

import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import UserShell from '../components/UserShell';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';

const UserRegister = () => {

  const navigate = useNavigate();

  const { user, registerUser } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });

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

      await registerUser(form);

      navigate('/upload');

    } catch (err) {

      setError(err.response?.data?.message || 'Registration failed');

    } finally {

      setSubmitting(false);

    }

  };



  return (

    <UserShell>

      <h1>Create Account</h1>

      <p className="subtitle">
        Create your account for AI skin &amp; hair analysis and dermatologist booking.
      </p>



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

          <label htmlFor="password">Password</label>

          <input

            id="password"

            name="password"

            type="password"

            value={form.password}

            onChange={handleChange}

            minLength={6}

            required

          />

        </div>



        <button type="submit" className="btn-user" disabled={submitting}>

          {submitting ? 'Creating account...' : 'Register'}

        </button>

      </form>



      <p className="link-row">

        Already have an account? <Link to="/login">Sign in</Link>

      </p>


    </UserShell>

  );

};



export default UserRegister;

