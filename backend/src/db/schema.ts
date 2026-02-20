import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<'ADMIN' | 'REVIEWER' | 'STUDENT'>().notNull().default('STUDENT'),
  stellarPublicKey: text('stellar_public_key').notNull(),
  encryptedStellarSecret: text('encrypted_stellar_secret').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Actividades extracurriculares ──────────────────────────────────────────────
export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  pointsReward: integer('points_reward').notNull(),
  deadline: text('deadline'), // ISO date string, null = sin límite
  maxSubmissions: integer('max_submissions'), // null = ilimitado por estudiante
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  status: text('status').$type<'ACTIVE' | 'INACTIVE'>().notNull().default('ACTIVE'),
  badgeImageUrl: text('badge_image_url'), // URL de la imagen del badge para esta actividad
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Pruebas de cumplimiento ────────────────────────────────────────────────────
export const proofSubmissions = sqliteTable('proof_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id')
    .notNull()
    .references(() => users.id),
  activityId: integer('activity_id')
    .notNull()
    .references(() => activities.id),
  description: text('description').notNull(),
  fileUrl: text('file_url'), // URL o ruta local al archivo subido
  status: text('status')
    .$type<'PENDING' | 'APPROVED' | 'REJECTED'>()
    .notNull()
    .default('PENDING'),
  reviewerId: integer('reviewer_id').references(() => users.id),
  reviewerNotes: text('reviewer_notes'),
  txHash: text('tx_hash'), // Hash de la tx de Stellar cuando se acuñan los puntos
  badgeTxHash: text('badge_tx_hash'), // Hash de la tx del contrato achievement_badges
  submittedAt: text('submitted_at').notNull().default(sql`(datetime('now'))`),
  reviewedAt: text('reviewed_at'),
});

// ── Recompensas canjeables ────────────────────────────────────────────────────
export const rewards = sqliteTable('rewards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  pointsCost: integer('points_cost').notNull(),
  rewardType: text('reward_type').$type<'PHYSICAL' | 'GRADE_BONUS'>().notNull(),
  stock: integer('stock'), // null = ilimitado
  imageUrl: text('image_url'), // URL de la imagen de la recompensa
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  status: text('status').$type<'ACTIVE' | 'INACTIVE'>().notNull().default('ACTIVE'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Canjes de recompensas ─────────────────────────────────────────────────────
export const redemptions = sqliteTable('redemptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id')
    .notNull()
    .references(() => users.id),
  rewardId: integer('reward_id')
    .notNull()
    .references(() => rewards.id),
  pointsSpent: integer('points_spent').notNull(),
  status: text('status')
    .$type<'PENDING' | 'COMPLETED' | 'CANCELLED'>()
    .notNull()
    .default('PENDING'),
  txHash: text('tx_hash'), // Hash del burn TX (clawback de puntos)
  redemptionTxHash: text('redemption_tx_hash'), // Hash del TX en redemption_records contract
  notes: text('notes'),
  redeemedAt: text('redeemed_at').notNull().default(sql`(datetime('now'))`),
  completedAt: text('completed_at'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type ProofSubmission = typeof proofSubmissions.$inferSelect;
export type NewProofSubmission = typeof proofSubmissions.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
export type Redemption = typeof redemptions.$inferSelect;
export type NewRedemption = typeof redemptions.$inferInsert;
