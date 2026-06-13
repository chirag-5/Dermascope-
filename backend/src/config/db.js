import mongoose from 'mongoose';
import { logError } from '../utils/logger.js';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logError(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
