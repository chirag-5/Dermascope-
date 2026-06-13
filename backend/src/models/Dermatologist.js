import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const dermatologistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: '',
    },
    clinicName: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true,
    },
    specialties: {
      type: [String],
      enum: ['skin', 'hair'],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one specialty area is required',
      },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    availability: {
      type: String,
      enum: ['available', 'limited', 'unavailable'],
      default: 'available',
    },
    consultationPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    role: {
      type: String,
      default: 'dermatologist',
      enum: ['dermatologist'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

dermatologistSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

dermatologistSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const Dermatologist = mongoose.model('Dermatologist', dermatologistSchema);

export default Dermatologist;
