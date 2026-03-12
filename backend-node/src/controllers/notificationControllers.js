/**
 * backend-node/src/controllers/notificationControllers.js
 */

import { query } from '../config/database.js';
import { addClient, removeClient } from '../services/notificationService.js';

export function streamNotifications(req, res) {
  const userId = req.user.id;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(': connected\n\n');

  addClient(userId, res);

  req.on('close', () => {
    removeClient(userId, res);
  });
}

export async function getNotifications(req, res) {
  try {
    const user = req.user;
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [user.id]
    );
    const unread = result.rows.filter((n) => !n.is_read).length;
    res.json({ notifications: result.rows, unread });
  } catch (err) {
    console.error('[getNotifications]', err);
    res.status(500).json({ error: 'Error al cargar notificaciones.' });
  }
}

export async function markNotificationsRead(req, res) {
  try {
    await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [
      req.user.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error('[markNotificationsRead]', err);
    res.status(500).json({ error: 'Error.' });
  }
}

export async function deleteNotification(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada o no tienes permisos.' });
    }

    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('[deleteNotification]', err);
    res.status(500).json({ error: 'Error al eliminar la notificación.' });
  }
}
