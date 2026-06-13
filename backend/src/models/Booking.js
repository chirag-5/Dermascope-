import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dermatologistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dermatologist',
      required: true,
      index: true,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'declined'],
      default: 'pending',
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    analysisForwarded: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ dermatologistId: 1, createdAt: -1 });
bookingSchema.index({ userId: 1, dermatologistId: 1, analysisId: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
