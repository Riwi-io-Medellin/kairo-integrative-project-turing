/**
 * controllers/resourceControllers.js
 */

import { query } from '../config/database.js';
import { supabase } from '../config/supabase.js';

const BUCKET = 'module-resources';

export async function uploadResource(req, res) {
  try {
    const tl = req.user;
    const { title, moduleId, description } = req.body;

    if (!req.file) return res.status(400).json({ error: 'Se requiere un archivo PDF.' });
    if (!title || !moduleId) return res.status(400).json({ error: 'Título y módulo son requeridos.' });

    const timestamp = Date.now();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `module-${moduleId}/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, req.file.buffer, { contentType: 'application/pdf', upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const result = await query(
      `INSERT INTO module_resources (tl_id, module_id, title, description, storage_path, file_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [tl.id, moduleId, title, description || null, storagePath, req.file.originalname]
    );

    res.json({ success: true, resourceId: result.rows[0].id });
  } catch (err) {
    console.error('[uploadResource]', err);
    res.status(500).json({ error: err.message || 'Error al subir recurso.' });
  }
}

export async function listResources(req, res) {
  try {
    const tl = req.user;
    const result = await query(
      `SELECT r.*, m.name AS module_name FROM module_resources r
       LEFT JOIN modules m ON r.module_id = m.id
       WHERE r.tl_id = $1 AND r.is_active = true
       ORDER BY r.created_at DESC`,
      [tl.id]
    );
    res.json({ resources: result.rows });
  } catch (err) {
    console.error('[listResources]', err);
    res.status(500).json({ error: 'Error al listar recursos.' });
  }
}

export async function deleteResource(req, res) {
  try {
    const tl = req.user;
    const { resourceId } = req.params;
    const result = await query(
      `UPDATE module_resources SET is_active = false WHERE id = $1 AND tl_id = $2 RETURNING storage_path`,
      [resourceId, tl.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Recurso no encontrado.' });
    await supabase.storage.from(BUCKET).remove([result.rows[0].storage_path]);
    res.json({ success: true });
  } catch (err) {
    console.error('[deleteResource]', err);
    res.status(500).json({ error: 'Error al eliminar recurso.' });
  }
}

export async function listResourcesCoder(req, res) {
  try {
    const coder = req.user;
    const coderResult = await query(
      `SELECT current_module_id FROM users WHERE id = $1`, [coder.id]
    );
    const moduleId = coderResult.rows[0]?.current_module_id;
    const result = await query(
      `SELECT r.id, r.title, r.description, r.file_name, r.module_id, m.name AS module_name, r.created_at
       FROM module_resources r
       LEFT JOIN modules m ON r.module_id = m.id
       WHERE r.is_active = true AND r.module_id = $1
       ORDER BY r.created_at DESC`,
      [moduleId]
    );
    res.json({ resources: result.rows });
  } catch (err) {
    console.error('[listResourcesCoder]', err);
    res.status(500).json({ error: 'Error al cargar recursos.' });
  }
}

export async function getResourceDownload(req, res) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT * FROM module_resources WHERE id = $1 AND is_active = true`, [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Recurso no encontrado.' });
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(result.rows[0].storage_path, 3600);
    if (error) throw error;
    res.json({ url: data.signedUrl, fileName: result.rows[0].file_name });
  } catch (err) {
    console.error('[getResourceDownload]', err);
    res.status(500).json({ error: 'Error al generar URL.' });
  }
}

export async function searchResources(req, res) {
  try {
    const coder = req.user;
    const { keyword } = req.body;
    const coderResult = await query(`SELECT current_module_id FROM users WHERE id = $1`, [coder.id]);
    const moduleId = coderResult.rows[0]?.current_module_id;
    const result = await query(
      `SELECT r.id, r.title, r.description, r.file_name, r.module_id, m.name AS module_name, r.created_at
       FROM module_resources r
       LEFT JOIN modules m ON r.module_id = m.id
       WHERE r.is_active = true AND r.module_id = $1
         AND (r.title ILIKE $2 OR r.description ILIKE $2)
       ORDER BY r.created_at DESC`,
      [moduleId, `%${keyword || ''}%`]
    );
    res.json({ resources: result.rows });
  } catch (err) {
    console.error('[searchResources]', err);
    res.status(500).json({ error: 'Error al buscar recursos.' });
  }
}
