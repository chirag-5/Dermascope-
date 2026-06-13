import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Dermatologist from '../models/Dermatologist.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret);

    let account;

    if (decoded.role === 'user') {
      account = await User.findById(decoded.id);
    } else if (decoded.role === 'dermatologist') {
      account = await Dermatologist.findById(decoded.id);
    }

    if (!account) {
      return res.status(401).json({ message: 'Not authorized, account not found' });
    }

    req.user = {
      id: account._id,
      name: account.name,
      email: account.email,
      role: account.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

export default protect;
