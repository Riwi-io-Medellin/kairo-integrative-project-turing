import 'dotenv/config';
import { query } from '../config/database.js';
import * as SoftSkills from '../models/softSkills.js';

export async function submitDiagnostic(req, res) {
  try {
    const userId = req.session.userId;
    const { answers, learningStyle } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers array is required' });
    }

    // Calculate scores from answers
    const scores = {
      autonomy: 3, timeManagement: 3, problemSolving: 3,
      communication: 3, teamwork: 3,
    };

    const result = await SoftSkills.create({
      coderId: userId,
      ...scores,
      learningStyle: learningStyle || 'visual',
      rawAnswers: answers,
    });

    await query(
      'UPDATE users SET first_login = false, learning_style_cache = $1 WHERE id = $2',
      [learningStyle || 'visual', userId]
    );

    res.json({ success: true, assessment: result });
  } catch (error) {
    console.error('[submitDiagnostic]', error);
    res.status(500).json({ error: 'Failed to submit diagnostic' });
  }
}

export async function getDiagnosticResults(req, res) {
  try {
    const result = await query(
      'SELECT * FROM soft_skills_assessment WHERE coder_id = $1',
      [req.session.userId]
    );
    res.json({ results: result.rows[0] || null });
  } catch (error) {
    console.error('[getDiagnosticResults]', error);
    res.status(500).json({ error: 'Failed to get diagnostic results' });
  }
}
