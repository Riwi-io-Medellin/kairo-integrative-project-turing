import { query } from '../config/database.js';

export async function generateExercise(req, res) {
  res.json({ message: 'Exercise generation coming soon' });
}

export async function submitExercise(req, res) {
  res.json({ message: 'Exercise submission coming soon' });
}

export async function getSubmissions(req, res) {
  res.json({ submissions: [] });
}
