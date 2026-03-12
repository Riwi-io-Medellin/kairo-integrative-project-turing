/**
 * controllers/profileControllers.js
 *
 * Coder Profile Session:
 *   GET    /api/coder/profile          → get full profile (Supabase + MongoDB)
 *   PUT    /api/coder/profile          → update MongoDB extended profile
 *   GET    /api/coder/profile/cv       → generate downloadable HTML CV
 */

import 'dotenv/config';
import { query } from '../config/database.js';
import CoderProfile from '../models/coderProfile.js';

/* ════════════════════════════════════════
   GET PROFILE  —  GET /api/coder/profile
   Returns merged data from Supabase (core) + MongoDB (extended)
════════════════════════════════════════ */
export async function getCoderProfile(req, res) {
  try {
    const userId = req.session.userId;

    /* 1 — Core user data + soft skills from Supabase/PostgreSQL */
    const [userResult, softSkillsResult, progressResult] = await Promise.all([
      query(
        `SELECT
           u.id, u.full_name, u.email, u.clan, u.role,
           u.current_module_id, u.learning_style_cache, u.created_at,
           m.name AS module_name
         FROM users u
         LEFT JOIN modules m ON m.id = u.current_module_id
         WHERE u.id = $1`,
        [userId]
      ),
      query(
        `SELECT autonomy, time_management, problem_solving,
                communication, teamwork, learning_style, assessed_at
         FROM soft_skills_assessment
         WHERE coder_id = $1`,
        [userId]
      ),
      query(
        `SELECT current_week, average_score, weeks_completed
         FROM moodle_progress
         WHERE coder_id = $1
         ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      ),
    ]);

    const user = userResult.rows[0] || null;
    const softSkills = softSkillsResult.rows[0] || null;
    const progress = progressResult.rows[0] || null;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    /* 2 — Extended profile from MongoDB (upsert-safe: creates if missing) */
    let extProfile = await CoderProfile.findOne({ userId });
    if (!extProfile) {
      extProfile = await CoderProfile.create({ userId });
    }

    /* 3 — Soft skills average */
    let softSkillsAverage = null;
    if (softSkills) {
      const vals = [
        softSkills.autonomy,
        softSkills.time_management,
        softSkills.problem_solving,
        softSkills.communication,
        softSkills.teamwork,
      ].filter((v) => v !== null && v !== undefined);
      softSkillsAverage = vals.length
        ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
        : null;
    }

    res.json({
      profile: {
        /* Core (from Supabase) */
        id:           user.id,
        fullName:     user.full_name,
        email:        user.email,
        clan:         user.clan,
        role:         user.role,
        moduleName:   user.module_name,
        learningStyle: user.learning_style_cache,
        memberSince:  user.created_at,

        /* Extended (from MongoDB) */
        bio:              extProfile.bio,
        phone:            extProfile.phone,
        location:         extProfile.location,
        avatarUrl:        extProfile.avatarUrl,
        jobTitle:         extProfile.jobTitle,
        socialLinks:      extProfile.socialLinks,
        technicalSkills:  extProfile.technicalSkills,
        experience:       extProfile.experience,
        education:        extProfile.education,
        languages:        extProfile.languages,
        isPublic:         extProfile.isPublic,

        /* Derived */
        softSkills: softSkills
          ? {
              autonomy:       softSkills.autonomy,
              timeManagement: softSkills.time_management,
              problemSolving: softSkills.problem_solving,
              communication:  softSkills.communication,
              teamwork:       softSkills.teamwork,
              learningStyle:  softSkills.learning_style,
              assessedAt:     softSkills.assessed_at,
              average:        softSkillsAverage,
            }
          : null,

        progress: progress
          ? {
              currentWeek:   progress.current_week,
              averageScore:  parseFloat(progress.average_score) || null,
              weeksCompleted: progress.weeks_completed || [],
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[getCoderProfile]', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
}

/* ════════════════════════════════════════
   UPDATE PROFILE  —  PUT /api/coder/profile
   Updates the MongoDB extended profile document.
════════════════════════════════════════ */
export async function updateCoderProfile(req, res) {
  try {
    const userId = req.session.userId;
    const {
      bio, phone, location, avatarUrl, jobTitle,
      socialLinks, technicalSkills, experience,
      education, languages, isPublic,
    } = req.body;

    /* Build update object — only include provided fields */
    const updates = {};
    if (bio            !== undefined) updates.bio            = bio;
    if (phone          !== undefined) updates.phone          = phone;
    if (location       !== undefined) updates.location       = location;
    if (avatarUrl      !== undefined) updates.avatarUrl      = avatarUrl;
    if (jobTitle       !== undefined) updates.jobTitle       = jobTitle;
    if (socialLinks    !== undefined) updates.socialLinks    = socialLinks;
    if (technicalSkills!== undefined) updates.technicalSkills = technicalSkills;
    if (experience     !== undefined) updates.experience     = experience;
    if (education      !== undefined) updates.education      = education;
    if (languages      !== undefined) updates.languages      = languages;
    if (isPublic       !== undefined) updates.isPublic       = isPublic;

    const extProfile = await CoderProfile.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, profile: extProfile });
  } catch (error) {
    console.error('[updateCoderProfile]', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

/* ════════════════════════════════════════
   GENERATE CV  —  GET /api/coder/profile/cv
   Returns a fully-rendered HTML CV ready for download / print-to-PDF.
════════════════════════════════════════ */
export async function generateCoderCV(req, res) {
  try {
    const userId = req.session.userId;

    /* Gather all profile data */
    const [userResult, softSkillsResult] = await Promise.all([
      query(
        `SELECT u.full_name, u.email, u.clan,
                m.name AS module_name
         FROM users u
         LEFT JOIN modules m ON m.id = u.current_module_id
         WHERE u.id = $1`,
        [userId]
      ),
      query(
        `SELECT autonomy, time_management, problem_solving,
                communication, teamwork, learning_style
         FROM soft_skills_assessment WHERE coder_id = $1`,
        [userId]
      ),
    ]);

    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const softSkills = softSkillsResult.rows[0] || null;

    let extProfile = await CoderProfile.findOne({ userId });
    if (!extProfile) {
      extProfile = {
        bio: '',
        jobTitle: '',
        phone: '',
        location: '',
        avatarUrl: '',
        socialLinks: {},
        technicalSkills: [],
        experience: [],
        education: [],
        languages: [],
      };
    }

    /* ─── Build HTML ─────────────────────────────────────────── */
    const skillLevel = { beginner: '●○○', intermediate: '●●○', advanced: '●●●' };

    const techSkillsHtml = (extProfile.technicalSkills || []).length > 0
      ? (extProfile.technicalSkills).map(s =>
          `<span class="skill-tag">${s.name} <small>${skillLevel[s.level] || ''}</small></span>`
        ).join('')
      : '<p class="muted">No technical skills listed yet.</p>';

    const softSkillsHtml = softSkills
      ? `
        <div class="skill-bar"><span>Autonomy</span><div class="bar"><div style="width:${(softSkills.autonomy/5)*100}%"></div></div></div>
        <div class="skill-bar"><span>Time Management</span><div class="bar"><div style="width:${(softSkills.time_management/5)*100}%"></div></div></div>
        <div class="skill-bar"><span>Problem Solving</span><div class="bar"><div style="width:${(softSkills.problem_solving/5)*100}%"></div></div></div>
        <div class="skill-bar"><span>Communication</span><div class="bar"><div style="width:${(softSkills.communication/5)*100}%"></div></div></div>
        <div class="skill-bar"><span>Teamwork</span><div class="bar"><div style="width:${(softSkills.teamwork/5)*100}%"></div></div></div>
      `
      : '<p class="muted">Soft skills assessment pending.</p>';

    const experienceHtml = (extProfile.experience || []).length > 0
      ? extProfile.experience.map(e => `
        <div class="cv-entry">
          <div class="cv-entry-header">
            <strong>${e.role}</strong>
            <span class="cv-date">${e.startDate} – ${e.endDate || 'Present'}</span>
          </div>
          <div class="cv-entry-sub">${e.company}</div>
          ${e.description ? `<p>${e.description}</p>` : ''}
        </div>`).join('')
      : '<p class="muted">No experience entries yet.</p>';

    const educationHtml = (extProfile.education || []).length > 0
      ? extProfile.education.map(e => `
        <div class="cv-entry">
          <div class="cv-entry-header">
            <strong>${e.degree} in ${e.field}</strong>
            <span class="cv-date">${e.startYear} – ${e.endYear || 'Present'}</span>
          </div>
          <div class="cv-entry-sub">${e.institution}</div>
        </div>`).join('')
      : `<div class="cv-entry"><strong>Riwi Bootcamp</strong><div class="cv-entry-sub">${user.module_name || 'Full-Stack Development'}</div></div>`;

    const socialHtml = Object.entries(extProfile.socialLinks || {})
      .filter(([, v]) => v)
      .map(([k, v]) => `<a href="${v}" class="cv-social">${k}</a>`)
      .join('');

    const cvHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV — ${user.full_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; color: #222; }
    .cv-wrapper { max-width: 900px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.12); }
    .cv-header { background: linear-gradient(135deg, #261339 0%, #5405a3 100%); color: #fff; padding: 40px 48px; display: flex; align-items: center; gap: 32px; }
    .cv-avatar { width: 100px; height: 100px; border-radius: 50%; background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; font-size: 42px; color: #fff; flex-shrink: 0; overflow: hidden; }
    .cv-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .cv-title h1 { font-size: 30px; font-weight: 700; }
    .cv-title p.job { font-size: 16px; opacity: .85; margin-top: 4px; }
    .cv-title .meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; font-size: 13px; opacity: .8; }
    .cv-title .meta span::before { margin-right: 4px; }
    .cv-body { display: grid; grid-template-columns: 280px 1fr; gap: 0; }
    .cv-sidebar { background: #f9f5ff; padding: 32px 24px; border-right: 1px solid #e8e0f0; }
    .cv-main { padding: 32px 36px; }
    .cv-section { margin-bottom: 28px; }
    .cv-section h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #5405a3; border-bottom: 2px solid #5405a3; padding-bottom: 6px; margin-bottom: 14px; }
    .cv-entry { margin-bottom: 16px; }
    .cv-entry-header { display: flex; justify-content: space-between; align-items: baseline; }
    .cv-entry-header strong { font-size: 15px; color: #1a0533; }
    .cv-date { font-size: 12px; color: #888; }
    .cv-entry-sub { font-size: 13px; color: #5405a3; margin: 2px 0 6px; }
    .cv-entry p { font-size: 13px; color: #555; line-height: 1.5; }
    .skill-tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-tag { background: #ede0ff; color: #5405a3; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 500; }
    .skill-tag small { font-size: 10px; opacity: .7; }
    .skill-bar { margin-bottom: 10px; }
    .skill-bar span { font-size: 12px; color: #444; display: block; margin-bottom: 4px; }
    .skill-bar .bar { background: #e8e0f0; border-radius: 4px; height: 6px; }
    .skill-bar .bar div { background: linear-gradient(90deg, #5405a3, #a855f7); border-radius: 4px; height: 100%; }
    .muted { color: #999; font-size: 13px; }
    .bio-text { font-size: 14px; color: #444; line-height: 1.6; }
    .cv-social { display: inline-block; color: #5405a3; font-size: 12px; margin-right: 8px; text-decoration: none; }
    .cv-contact p { font-size: 13px; color: #444; margin-bottom: 6px; word-break: break-all; }
    .lang-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .lang-tag { background: #261339; color: #fff; border-radius: 4px; padding: 3px 10px; font-size: 12px; }
    @media print {
      body { background: #fff; }
      .cv-wrapper { box-shadow: none; margin: 0; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="cv-wrapper">
    <!-- HEADER -->
    <header class="cv-header">
      <div class="cv-avatar">
        ${extProfile.avatarUrl
          ? `<img src="${extProfile.avatarUrl}" alt="Avatar">`
          : '👤'}
      </div>
      <div class="cv-title">
        <h1>${user.full_name}</h1>
        <p class="job">${extProfile.jobTitle || 'Full-Stack Developer in Training'}</p>
        <div class="meta">
          ${user.email ? `<span>✉ ${user.email}</span>` : ''}
          ${extProfile.phone ? `<span>📞 ${extProfile.phone}</span>` : ''}
          ${extProfile.location ? `<span>📍 ${extProfile.location}</span>` : ''}
          ${user.clan ? `<span>🏅 Clan ${user.clan}</span>` : ''}
        </div>
      </div>
    </header>

    <div class="cv-body">
      <!-- SIDEBAR -->
      <aside class="cv-sidebar">
        ${extProfile.bio ? `
        <div class="cv-section">
          <h2>About Me</h2>
          <p class="bio-text">${extProfile.bio}</p>
        </div>` : ''}

        <div class="cv-section">
          <h2>Soft Skills</h2>
          ${softSkillsHtml}
        </div>

        ${(extProfile.languages || []).length > 0 ? `
        <div class="cv-section">
          <h2>Languages</h2>
          <div class="lang-list">
            ${extProfile.languages.map(l => `<span class="lang-tag">${l}</span>`).join('')}
          </div>
        </div>` : ''}

        <div class="cv-section">
          <h2>Contact</h2>
          <div class="cv-contact">
            ${user.email ? `<p>✉ ${user.email}</p>` : ''}
            ${extProfile.phone ? `<p>📞 ${extProfile.phone}</p>` : ''}
            ${extProfile.location ? `<p>📍 ${extProfile.location}</p>` : ''}
          </div>
          ${socialHtml ? `<div style="margin-top:10px">${socialHtml}</div>` : ''}
        </div>
      </aside>

      <!-- MAIN -->
      <main class="cv-main">
        <div class="cv-section">
          <h2>Technical Skills</h2>
          <div class="skill-tags">${techSkillsHtml}</div>
        </div>

        <div class="cv-section">
          <h2>Experience</h2>
          ${experienceHtml}
        </div>

        <div class="cv-section">
          <h2>Education</h2>
          ${educationHtml}
        </div>
      </main>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="CV_${user.full_name.replace(/\s+/g, '_')}.html"`
    );
    res.send(cvHtml);
  } catch (error) {
    console.error('[generateCoderCV]', error);
    res.status(500).json({ error: 'Failed to generate CV' });
  }
}
