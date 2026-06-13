import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'dermatologist'],
      required: true,
    },
    senderName: {
      type: String,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

messageSchema.index({ bookingId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
