import { query } from '../config/database.js';

export async function getAssignments(req, res) {
  res.json({ assignments: [] });
}

export async function createAssignment(req, res) {
  res.json({ success: true });
}

export async function updateAssignment(req, res) {
  res.json({ success: true });
}

export async function deleteAssignment(req, res) {
  res.json({ success: true });
}
