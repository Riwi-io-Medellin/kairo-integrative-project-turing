import mongoose from 'mongoose';

const moodleProgressSchema = new mongoose.Schema({
  coderId:          { type: Number, required: true, index: true },
  moduleId:         { type: Number },
  currentWeek:      { type: Number, default: 1 },
  averageScore:     { type: Number, default: null },
  strugglingTopics: { type: [String], default: [] },
  weeksCompleted:   { type: mongoose.Schema.Types.Mixed, default: [] },
}, { timestamps: true });

export default mongoose.model('MoodleProgress', moodleProgressSchema);
