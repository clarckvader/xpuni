import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { config } from './config';

// ── Singletons ────────────────────────────────────────────────────────────────

const adapter = new PrismaBetterSqlite3({
  url: process.env['DATABASE_URL'] ?? `file:${config.databasePath}`,
});
export const prisma = new PrismaClient({ adapter } as any);

import { StellarService } from './services/stellar.service';
export const stellarService = new StellarService(config);

// ── Repositories ──────────────────────────────────────────────────────────────

import { UserRepository } from './repositories/user.repository';
import { ActivityRepository } from './repositories/activity.repository';
import { SubmissionRepository } from './repositories/submission.repository';
import { RewardRepository } from './repositories/reward.repository';
import { RedemptionRepository } from './repositories/redemption.repository';

export const userRepo = new UserRepository(prisma);
export const activityRepo = new ActivityRepository(prisma);
export const submissionRepo = new SubmissionRepository(prisma);
export const rewardRepo = new RewardRepository(prisma);
export const redemptionRepo = new RedemptionRepository(prisma);

// ── Services ──────────────────────────────────────────────────────────────────

import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { ActivityService } from './services/activity.service';
import { SubmissionService } from './services/submission.service';
import { RewardService } from './services/reward.service';
import { RedemptionService } from './services/redemption.service';

export const authService = new AuthService(userRepo, stellarService, config);
export const userService = new UserService(userRepo, stellarService);
export const activityService = new ActivityService(activityRepo);
export const submissionService = new SubmissionService(
  submissionRepo,
  activityRepo,
  userRepo,
  stellarService,
  config,
);
export const rewardService = new RewardService(rewardRepo);
export const redemptionService = new RedemptionService(
  redemptionRepo,
  rewardRepo,
  userRepo,
  stellarService,
  config,
);

// ── Controllers ───────────────────────────────────────────────────────────────

import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { ActivityController } from './controllers/activity.controller';
import { SubmissionController } from './controllers/submission.controller';
import { RewardController } from './controllers/reward.controller';
import { RedemptionController } from './controllers/redemption.controller';

export const authController = new AuthController(authService);
export const userController = new UserController(userService);
export const activityController = new ActivityController(activityService);
export const submissionController = new SubmissionController(submissionService);
export const rewardController = new RewardController(rewardService);
export const redemptionController = new RedemptionController(redemptionService);
