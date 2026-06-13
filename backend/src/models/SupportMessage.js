import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportTicket',
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'support'],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    senderName: {
      type: String,
      required: true,
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

supportMessageSchema.index({ ticketId: 1, createdAt: 1 });

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);

export default SupportMessage;
