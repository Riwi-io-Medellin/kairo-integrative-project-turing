import { query } from '../config/database.js';

export async function getNotifications(req, res) {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.session.userId]
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('[getNotifications]', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
}

export async function markAllRead(req, res) {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.session.userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
}
