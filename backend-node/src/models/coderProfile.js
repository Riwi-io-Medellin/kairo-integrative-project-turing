/**
 * models/coderProfile.js
 * Extended Coder Profile — stored in MongoDB.
 *
 * Stores personal information, skills, social links, and other
 * profile data that goes beyond the core Supabase user record.
 * One document per coder (userId is unique).
 */

import mongoose from 'mongoose';

const socialLinksSchema = new mongoose.Schema({
  github:   { type: String, trim: true, default: '' },
  linkedin: { type: String, trim: true, default: '' },
  twitter:  { type: String, trim: true, default: '' },
  discord:  { type: String, trim: true, default: '' },
  portfolio:{ type: String, trim: true, default: '' },
}, { _id: false });

const technicalSkillSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  level:      { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  category:   { type: String, trim: true, default: 'Programming' },
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  role:        { type: String, trim: true },
  company:     { type: String, trim: true },
  startDate:   { type: String, trim: true },
  endDate:     { type: String, trim: true, default: 'Present' },
  description: { type: String, trim: true },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  institution: { type: String, trim: true },
  degree:      { type: String, trim: true },
  field:       { type: String, trim: true },
  startYear:   { type: Number },
  endYear:     { type: Number },
}, { _id: false });

const coderProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    /* ── Personal info ── */
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    jobTitle: {
      type: String,
      trim: true,
      default: 'Full-Stack Developer in Training',
    },

    /* ── Social links ── */
    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },

    /* ── Technical skills ── */
    technicalSkills: {
      type: [technicalSkillSchema],
      default: [],
    },

    /* ── Experience ── */
    experience: {
      type: [experienceSchema],
      default: [],
    },

    /* ── Education ── */
    education: {
      type: [educationSchema],
      default: [],
    },

    /* ── Languages spoken ── */
    languages: {
      type: [String],
      default: [],
    },

    /* ── Profile visibility ── */
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'coder_profiles',
  }
);

export default mongoose.model('CoderProfile', coderProfileSchema);
