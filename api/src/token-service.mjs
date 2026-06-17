import { randomBytes } from 'node:crypto';
import { getPool } from './db.mjs';
import { authenticateRequest } from './auth.mjs';
import { httpError } from './org-service.mjs';

const MAX_CIPHERTEXT_BYTES = 64 * 1024;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function newTokenId() {
  return `vt_${randomBytes(16).toString('base64url')}`;
}

function sanitizeCiphertext(value) {
  const ciphertext = String(value || '').trim();
  if (!ciphertext) throw httpError(400, 'ciphertext is required.');
  if (Buffer.byteLength(ciphertext, 'utf8') > MAX_CIPHERTEXT_BYTES) {
    throw httpError(400, 'ciphertext too large.');
  }
  return ciphertext;
}

export async function createSecureToken(token, deviceId, body = {}) {
  const auth = await authenticateRequest(token, deviceId);
  const ciphertext = sanitizeCiphertext(body.ciphertext);
  const category = String(body.category || '').slice(0, 64);
  const burnAfterRead = body.burnAfterRead !== false;
  const maxReads = Math.min(20, Math.max(1, Number(body.maxReads) || 5));
  const ttlMs = Math.min(30 * 24 * 60 * 60 * 1000, Math.max(60_000, Number(body.ttlMs) || DEFAULT_TTL_MS));
  const expiresAt = new Date(Date.now() + ttlMs);
  const id = newTokenId();

  const pool = getPool();
  await pool.query(
    `INSERT INTO secure_tokens (
       id, org_id, device_id, member_email, ciphertext, category,
       expires_at, burn_after_read, max_reads
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      auth.org_id,
      auth.device_id,
      auth.member_email || null,
      ciphertext,
      category,
      expiresAt,
      burnAfterRead,
      maxReads,
    ],
  );

  return {
    ok: true,
    tokenId: id,
    expiresAt: expiresAt.toISOString(),
    burnAfterRead,
    maxReads,
  };
}

export async function resolveSecureToken(token, deviceId, tokenId) {
  const auth = await authenticateRequest(token, deviceId);
  const id = String(tokenId || '').trim();
  if (!id.startsWith('vt_')) throw httpError(400, 'Invalid token id.');

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT id, ciphertext, category, expires_at, burn_after_read, read_count, max_reads
       FROM secure_tokens
       WHERE id = $1 AND org_id = $2
       FOR UPDATE`,
      [id, auth.org_id],
    );

    if (result.rowCount === 0) throw httpError(404, 'Token not found.');
    const row = result.rows[0];

    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      await client.query('DELETE FROM secure_tokens WHERE id = $1', [id]);
      await client.query('COMMIT');
      throw httpError(410, 'Token expired.');
    }

    const nextCount = Number(row.read_count) + 1;
    if (nextCount > Number(row.max_reads)) {
      await client.query('DELETE FROM secure_tokens WHERE id = $1', [id]);
      await client.query('COMMIT');
      throw httpError(410, 'Token read limit exceeded.');
    }

    if (row.burn_after_read || nextCount >= Number(row.max_reads)) {
      await client.query('DELETE FROM secure_tokens WHERE id = $1', [id]);
    } else {
      await client.query(
        'UPDATE secure_tokens SET read_count = $1 WHERE id = $2',
        [nextCount, id],
      );
    }

    await client.query('COMMIT');

    return {
      ok: true,
      tokenId: row.id,
      ciphertext: row.ciphertext,
      category: row.category,
      readsRemaining: Math.max(0, Number(row.max_reads) - nextCount),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
