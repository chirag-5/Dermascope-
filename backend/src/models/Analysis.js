import mongoose from 'mongoose';

const detectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['skin', 'hair'],
      required: true,
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalImage: {
      type: String,
      required: true,
    },
    annotatedImage: {
      type: String,
      default: null,
    },
    detections: {
      type: [detectionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;
