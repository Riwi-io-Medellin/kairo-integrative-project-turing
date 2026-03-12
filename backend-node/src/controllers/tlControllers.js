import { query } from '../config/database.js';

export async function getTLDashboard(req, res) {
  res.json({ message: 'TL Dashboard' });
}

export async function getCoders(req, res) {
  try {
    const result = await query(
      "SELECT id, full_name, email, clan FROM users WHERE role = 'coder' ORDER BY full_name"
    );
    res.json({ coders: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get coders' });
  }
}

export async function submitFeedback(req, res) {
  res.json({ success: true });
}

export async function getFeedback(req, res) {
  res.json({ feedback: [] });
}

export async function updateRisk(req, res) {
  res.json({ success: true });
}

export async function getRisks(req, res) {
  res.json({ risks: [] });
}
