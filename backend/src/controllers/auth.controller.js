import User from '../models/User.js';
import Dermatologist from '../models/Dermatologist.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const buildAuthResponse = (account) => ({
  _id: account._id,
  name: account.name,
  email: account.email,
  role: account.role,
  token: generateToken({ id: account._id, role: account.role }),
});

const getGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    const error = new Error('GOOGLE_CLIENT_ID is not defined');
    error.statusCode = 500;
    throw error;
  }

  return new OAuth2Client(clientId);
};

const verifyGoogleToken = async (credential) => {
  if (!credential) {
    const error = new Error('Google credential is required');
    error.statusCode = 400;
    throw error;
  }

  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.email_verified) {
    const error = new Error('Google account email is not verified');
    error.statusCode = 401;
    throw error;
  }

  return {
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
  };
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const existingDermatologist = await Dermatologist.findOne({ email });
    if (existingDermatologist) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password });

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const registerDermatologist = async (req, res) => {
  try {
    const { name, email, password, clinicName, specialties } = req.body;

    if (!name || !email || !password || !clinicName) {
      return res.status(400).json({
        message: 'Name, email, password, and clinic name are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!Array.isArray(specialties) || specialties.length === 0) {
      return res.status(400).json({
        message: 'Select at least one specialty area (skin or hair)',
      });
    }

    const validSpecialties = specialties.filter((item) => ['skin', 'hair'].includes(item));

    if (validSpecialties.length === 0) {
      return res.status(400).json({
        message: 'Specialty areas must include skin and/or hair',
      });
    }

    const existingDermatologist = await Dermatologist.findOne({ email });
    if (existingDermatologist) {
      return res.status(409).json({ message: 'Dermatologist with this email already exists' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const dermatologist = await Dermatologist.create({
      name,
      email,
      password,
      clinicName,
      specialties: validSpecialties,
    });

    return res.status(201).json(buildAuthResponse(dermatologist));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginDermatologist = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const dermatologist = await Dermatologist.findOne({ email }).select('+password');

    if (!dermatologist || !(await dermatologist.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json(buildAuthResponse(dermatologist));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const loginWithGoogle = async (req, res) => {
  try {
    const { credential, role = 'user' } = req.body;
    const googleUser = await verifyGoogleToken(credential);

    if (role === 'dermatologist') {
      const dermatologist = await Dermatologist.findOne({ email: googleUser.email });

      if (!dermatologist) {
        return res.status(404).json({
          message:
            'No dermatologist account found for this Google email. Please use password login or register first.',
        });
      }

      return res.json(buildAuthResponse(dermatologist));
    }

    const existingUser = await User.findOne({ email: googleUser.email });

    if (existingUser) {
      return res.json(buildAuthResponse(existingUser));
    }

    const user = await User.create({
      name: googleUser.name,
      email: googleUser.email,
      password: crypto.randomBytes(24).toString('hex'),
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  return res.json(req.user);
};
