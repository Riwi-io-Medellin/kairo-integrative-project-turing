/**
 * models/coderProfile.js
 *
 * MongoDB Mongoose schema for the extended coder profile.
 * Stores rich personal information, skills, education, experience,
 * and certifications that are used to render the profile page
 * and generate a structured CV.
 *
 * Each document is keyed by coderId (the PostgreSQL users.id integer),
 * so there is exactly one profile document per coder.
 */

import mongoose from 'mongoose';

/* ── Sub-schemas ──────────────────────────────────────────── */

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true, required: true },
    degree: { type: String, trim: true, required: true },
    field: { type: String, trim: true, default: '' },
    startDate: { type: String, trim: true, default: '' }, // "2020-01"
    endDate: { type: String, trim: true, default: '' },   // "2023-12" | "Present"
    description: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, trim: true, required: true },
    position: { type: String, trim: true, required: true },
    startDate: { type: String, trim: true, default: '' },
    endDate: { type: String, trim: true, default: '' }, // "Present" if current
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, default: '' },
    technologies: [{ type: String, trim: true }],
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    technologies: [{ type: String, trim: true }],
    repoUrl: { type: String, trim: true, default: '' },
    demoUrl: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    issuer: { type: String, trim: true, default: '' },
    issueDate: { type: String, trim: true, default: '' },
    credentialUrl: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const languageSchema = new mongoose.Schema(
  {
    language: { type: String, trim: true, required: true },
    level: {
      type: String,
      trim: true,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'],
      default: 'B1',
    },
  },
  { _id: true }
);

/* ── Main schema ─────────────────────────────────────────── */

const coderProfileSchema = new mongoose.Schema(
  {
    /* Link back to PostgreSQL users.id */
    coderId: { type: Number, required: true, unique: true, index: true },

    /* Personal information */
    bio: { type: String, trim: true, maxlength: 600, default: '' },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    photoUrl: { type: String, trim: true, default: '' },
    linkedinUrl: { type: String, trim: true, default: '' },
    githubUrl: { type: String, trim: true, default: '' },
    portfolioUrl: { type: String, trim: true, default: '' },

    /* Technical skills — free-form array of skill names */
    technicalSkills: [{ type: String, trim: true }],

    /* Spoken languages */
    languages: [languageSchema],

    /* Education history */
    education: [educationSchema],

    /* Work experience */
    experience: [experienceSchema],

    /* Projects / portfolio */
    projects: [projectSchema],

    /* Certifications */
    certifications: [certificationSchema],

    /* Timestamps managed by Mongoose */
  },
  {
    timestamps: true,         // createdAt, updatedAt
    collection: 'coder_profiles',
  }
);

const CoderProfile = mongoose.model('CoderProfile', coderProfileSchema);

export default CoderProfile;
