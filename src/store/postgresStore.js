// src/store/postgresStore.js

/**
 * PostgreSQL Implementation Blueprint
 * 
 * To switch to Postgres in the future:
 * 1. Install 'pg': npm install pg
 * 2. Set DATABASE_URL in your .env
 * 3. Create table in Postgres:
 * 
 * CREATE TABLE pastes (
 *   id VARCHAR(32) PRIMARY KEY,
 *   title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
 *   content TEXT NOT NULL,
 *   language VARCHAR(64) NOT NULL DEFAULT 'plaintext',
 *   burn_after_read BOOLEAN NOT NULL DEFAULT FALSE,
 *   views INTEGER NOT NULL DEFAULT 0,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   expires_at TIMESTAMPTZ NULL
 * );
 * CREATE INDEX idx_pastes_expires_at ON pastes(expires_at);
 */

export class PostgresPasteStore {
  constructor(pool) {
    this.pool = pool; // pg.Pool instance
  }

  async create(paste) {
    const query = `
      INSERT INTO pastes (id, title, content, language, burn_after_read, views, created_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, title, content, language,
        burn_after_read AS "burnAfterRead",
        views,
        created_at AS "createdAt",
        expires_at AS "expiresAt"
    `;
    const values = [
      paste.id,
      paste.title,
      paste.content,
      paste.language,
      paste.burnAfterRead,
      paste.views,
      paste.createdAt,
      paste.expiresAt,
    ];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async findById(id) {
    const query = `
      SELECT 
        id, title, content, language,
        burn_after_read AS "burnAfterRead",
        views,
        created_at AS "createdAt",
        expires_at AS "expiresAt"
      FROM pastes
      WHERE id = $1
    `;
    const { rows } = await this.pool.query(query, [id]);
    return rows[0] || null;
  }

  async update(id, updates) {
    const query = `
      UPDATE pastes
      SET 
        content = COALESCE($2, content),
        title = COALESCE($3, title),
        language = COALESCE($4, language),
        views = COALESCE($5, views)
      WHERE id = $1
      RETURNING 
        id, title, content, language,
        burn_after_read AS "burnAfterRead",
        views,
        created_at AS "createdAt",
        expires_at AS "expiresAt"
    `;
    const { rows } = await this.pool.query(query, [
      id,
      updates.content !== undefined ? updates.content : null,
      updates.title !== undefined ? updates.title : null,
      updates.language !== undefined ? updates.language : null,
      updates.views !== undefined ? updates.views : null,
    ]);
    return rows[0] || null;
  }

  async delete(id) {
    const query = `DELETE FROM pastes WHERE id = $1`;
    const res = await this.pool.query(query, [id]);
    return res.rowCount > 0;
  }

  async cleanupExpired() {
    const query = `DELETE FROM pastes WHERE expires_at IS NOT NULL AND expires_at < NOW()`;
    const res = await this.pool.query(query);
    return res.rowCount;
  }
}
