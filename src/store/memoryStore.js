// src/store/memoryStore.js

/**
 * In-memory Map-based store for code snippets.
 * Mirrors the repository interface designed for easy swapping with PostgreSQL.
 */
export class MemoryPasteStore {
  constructor() {
    this.pastes = new Map();
  }

  /**
   * Save a new paste
   * @param {Object} paste 
   * @returns {Promise<Object>}
   */
  async create(paste) {
    this.pastes.set(paste.id, { ...paste });
    return this.pastes.get(paste.id);
  }

  /**
   * Retrieve a paste by id
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const paste = this.pastes.get(id);
    return paste ? { ...paste } : null;
  }

  /**
   * Update an existing paste (e.g. view count)
   * @param {string} id 
   * @param {Object} updates 
   * @returns {Promise<Object|null>}
   */
  async update(id, updates) {
    const existing = this.pastes.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.pastes.set(id, updated);
    return { ...updated };
  }

  /**
   * Delete a paste by id (for expiration or burn-after-read)
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return this.pastes.delete(id);
  }

  /**
   * Optional helper to prune expired pastes
   * @returns {Promise<number>} count of pruned items
   */
  async cleanupExpired() {
    const now = new Date();
    let count = 0;
    for (const [id, paste] of this.pastes.entries()) {
      if (paste.expiresAt && now > new Date(paste.expiresAt)) {
        this.pastes.delete(id);
        count++;
      }
    }
    return count;
  }
}
