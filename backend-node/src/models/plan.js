import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  dayNumber:   { type: Number, required: true },
  title:       { type: String, required: true },
  description: { type: String },
  type:        { type: String, enum: ['reading', 'exercise', 'video', 'practice'], default: 'exercise' },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
});

const planSchema = new mongoose.Schema({
  coderId:           { type: Number, required: true, index: true },
  moduleId:          { type: Number },
  planContent:       { type: mongoose.Schema.Types.Mixed },
  targetedSoftSkill: { type: String },
  isActive:          { type: Boolean, default: true },
  completedDays:     { type: mongoose.Schema.Types.Mixed, default: {} },
  activities:        [activitySchema],
}, { timestamps: true });

export default mongoose.model('Plan', planSchema);
