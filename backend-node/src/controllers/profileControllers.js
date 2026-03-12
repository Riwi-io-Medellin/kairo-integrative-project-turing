/**
 * controllers/profileControllers.js
 *
 * Coder Profile Session — reads and writes the extended coder profile
 * stored in MongoDB (CoderProfile model) and combines it with the
 * core user data from PostgreSQL to build a complete profile response.
 *
 * Routes:
 *   GET  /api/coder/profile         → getProfile
 *   PUT  /api/coder/profile         → updateProfile
 *   GET  /api/coder/profile/cv      → generateCV
 */

import CoderProfile from '../models/coderProfile.js';
import { query } from '../config/database.js';

/* ════════════════════════════════════════
   GET PROFILE  —  GET /api/coder/profile
   Returns the full coder profile merging PostgreSQL user data
   (full_name, email, clan, learning_style) with the rich extended
   profile stored in MongoDB.
════════════════════════════════════════ */

export async function getProfile(req, res) {
  try {
    const userId = req.session.userId;

    // 1. Base user data + soft skills from PostgreSQL
    const pgResult = await query(
      `
      SELECT
        u.id, u.full_name, u.email, u.clan, u.created_at,
        ss.learning_style, ss.autonomy, ss.time_management,
        ss.problem_solving, ss.communication, ss.teamwork,
        ss.assessed_at AS skills_assessed_at
      FROM users u
      LEFT JOIN soft_skills_assessment ss ON ss.coder_id = u.id
      WHERE u.id = $1
      `,
      [userId]
    );

    const pgUser = pgResult.rows[0] || null;
    if (!pgUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Extended profile from MongoDB (upsert-style: return empty doc if not yet created)
    let mongoProfile = await CoderProfile.findOne({ coderId: userId }).lean();

    if (!mongoProfile) {
      // Return a sensible empty shell so the UI can render the edit form
      mongoProfile = {
        coderId: userId,
        bio: '',
        phone: '',
        location: '',
        photoUrl: '',
        linkedinUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        technicalSkills: [],
        languages: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        createdAt: null,
        updatedAt: null,
      };
    }

    res.json({
      profile: {
        /* ── Core (PostgreSQL) ── */
        id: pgUser.id,
        fullName: pgUser.full_name,
        email: pgUser.email,
        clan: pgUser.clan,
        memberSince: pgUser.created_at,

        /* ── Soft-skills snapshot (PostgreSQL) ── */
        softSkills: pgUser.learning_style
          ? {
              learningStyle: pgUser.learning_style,
              autonomy: pgUser.autonomy,
              timeManagement: pgUser.time_management,
              problemSolving: pgUser.problem_solving,
              communication: pgUser.communication,
              teamwork: pgUser.teamwork,
              assessedAt: pgUser.skills_assessed_at,
            }
          : null,

        /* ── Extended profile (MongoDB) ── */
        bio: mongoProfile.bio,
        phone: mongoProfile.phone,
        location: mongoProfile.location,
        photoUrl: mongoProfile.photoUrl,
        linkedinUrl: mongoProfile.linkedinUrl,
        githubUrl: mongoProfile.githubUrl,
        portfolioUrl: mongoProfile.portfolioUrl,
        technicalSkills: mongoProfile.technicalSkills,
        languages: mongoProfile.languages,
        education: mongoProfile.education,
        experience: mongoProfile.experience,
        projects: mongoProfile.projects,
        certifications: mongoProfile.certifications,
        updatedAt: mongoProfile.updatedAt,
      },
    });
  } catch (error) {
    console.error('[getProfile]', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
}

/* ════════════════════════════════════════
   UPDATE PROFILE  —  PUT /api/coder/profile
   Upserts the extended profile in MongoDB.
   Only the fields provided in the request body are updated.
   Body (all optional):
   {
     bio, phone, location, photoUrl, linkedinUrl, githubUrl, portfolioUrl,
     technicalSkills: string[],
     languages:       [{ language, level }],
     education:       [{ institution, degree, field, startDate, endDate, description }],
     experience:      [{ company, position, startDate, endDate, current, description, technologies }],
     projects:        [{ name, description, technologies, repoUrl, demoUrl }],
     certifications:  [{ name, issuer, issueDate, credentialUrl }]
   }
════════════════════════════════════════ */

export async function updateProfile(req, res) {
  try {
    const userId = req.session.userId;

    const allowedFields = [
      'bio',
      'phone',
      'location',
      'photoUrl',
      'linkedinUrl',
      'githubUrl',
      'portfolioUrl',
      'technicalSkills',
      'languages',
      'education',
      'experience',
      'projects',
      'certifications',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const profile = await CoderProfile.findOneAndUpdate(
      { coderId: userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        bio: profile.bio,
        phone: profile.phone,
        location: profile.location,
        photoUrl: profile.photoUrl,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        portfolioUrl: profile.portfolioUrl,
        technicalSkills: profile.technicalSkills,
        languages: profile.languages,
        education: profile.education,
        experience: profile.experience,
        projects: profile.projects,
        certifications: profile.certifications,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: Object.values(error.errors).map((e) => e.message),
      });
    }
    console.error('[updateProfile]', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

/* ════════════════════════════════════════
   GENERATE CV  —  GET /api/coder/profile/cv
   Returns a structured CV-ready payload composed of the coder's
   profile data (PostgreSQL + MongoDB).  The frontend can render
   this as HTML/PDF or download it as JSON.
════════════════════════════════════════ */

export async function generateCV(req, res) {
  try {
    const userId = req.session.userId;

    // 1. Base data from PostgreSQL
    const pgResult = await query(
      `
      SELECT
        u.full_name, u.email, u.clan, u.created_at,
        ss.learning_style, ss.autonomy, ss.time_management,
        ss.problem_solving, ss.communication, ss.teamwork
      FROM users u
      LEFT JOIN soft_skills_assessment ss ON ss.coder_id = u.id
      WHERE u.id = $1
      `,
      [userId]
    );

    const pgUser = pgResult.rows[0];
    if (!pgUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Extended profile from MongoDB
    const mongoProfile = await CoderProfile.findOne({ coderId: userId }).lean();

    // 3. Build soft skills summary (only include if assessed)
    let softSkillsSummary = null;
    if (pgUser.learning_style) {
      const labelMap = {
        autonomy: 'Autonomy',
        time_management: 'Time Management',
        problem_solving: 'Problem Solving',
        communication: 'Communication',
        teamwork: 'Teamwork',
      };

      const scores = Object.entries(labelMap).map(([key, label]) => ({
        skill: label,
        score: pgUser[key],
        outOf: 5,
      }));

      softSkillsSummary = {
        learningStyle: pgUser.learning_style,
        scores,
      };
    }

    // 4. Compose the CV document
    const cv = {
      generatedAt: new Date().toISOString(),
      personal: {
        fullName: pgUser.full_name,
        email: pgUser.email,
        phone: mongoProfile?.phone || '',
        location: mongoProfile?.location || '',
        photoUrl: mongoProfile?.photoUrl || '',
        bio: mongoProfile?.bio || '',
        linkedinUrl: mongoProfile?.linkedinUrl || '',
        githubUrl: mongoProfile?.githubUrl || '',
        portfolioUrl: mongoProfile?.portfolioUrl || '',
      },
      riwi: {
        clan: pgUser.clan,
        memberSince: pgUser.created_at,
        softSkills: softSkillsSummary,
      },
      technicalSkills: mongoProfile?.technicalSkills || [],
      languages: mongoProfile?.languages || [],
      education: mongoProfile?.education || [],
      experience: mongoProfile?.experience || [],
      projects: mongoProfile?.projects || [],
      certifications: mongoProfile?.certifications || [],
    };

    res.json({ cv });
  } catch (error) {
    console.error('[generateCV]', error);
    res.status(500).json({ error: 'Failed to generate CV' });
  }
}
