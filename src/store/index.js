// src/store/index.js
import { MemoryPasteStore } from "./memoryStore.js";
// When moving to Postgres in the future:
// import { PostgresPasteStore } from "./postgresStore.js";
// import pg from "pg";

/**
 * Store Factory
 * Defaults to in-memory Map store.
 * You can switch to PostgreSQL here whenever you are ready.
 */
function createStore() {
  const driver = process.env.DB_DRIVER || "memory";

  if (driver === "postgres") {
    // const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    // return new PostgresPasteStore(pool);
    throw new Error("PostgreSQL driver requested but pg pool is not configured yet.");
  }

  return new MemoryPasteStore();
}

export const pasteStore = createStore();
