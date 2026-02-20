import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';
import { config } from '../config';

// Usa el módulo SQLite nativo de Node.js (Node >= 22.5) — sin compilación nativa
const sqlite = new DatabaseSync(config.databasePath);
sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA foreign_keys = ON");

export const db = drizzle(
  async (sql, params, method) => {
    const stmt = sqlite.prepare(sql);
    if (method === 'run') {
      stmt.run(...(params as []));
      return { rows: [] };
    }
    const rows = stmt.all(...(params as [])) as Record<string, unknown>[];
    return { rows: rows.map((row) => Object.values(row)) };
  },
  { schema },
);

/**
 * Crea las tablas si no existen.
 * Se llama una vez al iniciar el servidor.
 */
export function runMigrations(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      stellar_public_key TEXT NOT NULL,
      encrypted_stellar_secret TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      points_reward INTEGER NOT NULL,
      deadline TEXT,
      max_submissions INTEGER,
      created_by INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS proof_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id),
      activity_id INTEGER NOT NULL REFERENCES activities(id),
      description TEXT NOT NULL,
      file_url TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      reviewer_id INTEGER REFERENCES users(id),
      reviewer_notes TEXT,
      tx_hash TEXT,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      points_cost INTEGER NOT NULL,
      reward_type TEXT NOT NULL,
      stock INTEGER,
      created_by INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id),
      reward_id INTEGER NOT NULL REFERENCES rewards(id),
      points_spent INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      tx_hash TEXT,
      notes TEXT,
      redeemed_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
  `);

  // ── Migraciones aditivas (idempotentes via try/catch) ──────────────────────
  // v2: badge_tx_hash en proof_submissions
  try {
    sqlite.exec(`ALTER TABLE proof_submissions ADD COLUMN badge_tx_hash TEXT`);
  } catch {
    // Columna ya existe — comportamiento esperado al reiniciar
  }

  // v3: badge_image_url en activities
  try {
    sqlite.exec(`ALTER TABLE activities ADD COLUMN badge_image_url TEXT`);
  } catch {
    // Columna ya existe — comportamiento esperado al reiniciar
  }

  // v4: image_url en rewards
  try {
    sqlite.exec(`ALTER TABLE rewards ADD COLUMN image_url TEXT`);
  } catch {
    // Columna ya existe — comportamiento esperado al reiniciar
  }

  // v5: redemption_tx_hash en redemptions
  try {
    sqlite.exec(`ALTER TABLE redemptions ADD COLUMN redemption_tx_hash TEXT`);
  } catch {
    // Columna ya existe — comportamiento esperado al reiniciar
  }
}
