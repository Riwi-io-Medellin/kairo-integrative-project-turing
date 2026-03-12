import { query } from '../config/database.js';

export async function notifyUser(userId, title, message, type = 'info', referenceId = null) {
  try {
    await query(
      'INSERT INTO notifications (user_id, title, message, type, reference_id) VALUES ($1, $2, $3, $4, $5)',
      [userId, title, message, type, referenceId]
    );
  } catch (error) {
    console.error('[notifyUser]', error.message);
  }
}
