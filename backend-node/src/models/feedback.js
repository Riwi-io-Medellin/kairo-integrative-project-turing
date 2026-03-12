import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  coderId:      { type: Number, required: true, index: true },
  tlId:         { type: Number, required: true },
  feedbackText: { type: String, required: true, trim: true },
  feedbackType: { type: String, enum: ['positive', 'constructive', 'urgent'], default: 'constructive' },
  isRead:       { type: Boolean, default: false },
  readAt:       { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('Feedback', feedbackSchema);
