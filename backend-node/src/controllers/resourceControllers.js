import { query } from '../config/database.js';

export async function searchResources(req, res) {
  res.json({ resources: [] });
}

export async function listResourcesCoder(req, res) {
  try {
    const result = await query('SELECT * FROM resources ORDER BY created_at DESC LIMIT 20');
    res.json({ resources: result.rows });
  } catch (error) {
    console.error('[listResourcesCoder]', error);
    res.status(500).json({ error: 'Failed to list resources' });
  }
}

export async function getResourceDownload(req, res) {
  res.json({ message: 'Resource download coming soon' });
}
