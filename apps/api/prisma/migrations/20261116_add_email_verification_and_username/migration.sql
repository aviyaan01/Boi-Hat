-- Migration: Add Email Verification, Username, and Auth Rate Limiting
-- Date: 2026-11-16
-- Description:
-- 1. Updates "users" table to support lowercase unique username, email verification timestamps, and optional phone.
-- 2. Creates "email_verifications" table for secure pending registration and login verification.
-- 3. Creates "auth_rate_limits" table for distributed rate-limiting and resend cooldowns.

-- ============================================================================
-- MIGRATION NOTE FOR EXISTING USERS WITHOUT EMAIL / USERNAME:
-- Existing phone-registered users who do not have an email or username populated
-- will remain functional via their phone numbers. When they next log in, they can
-- be prompted to link an email address and set their unique username.
-- For database integrity, default usernames can be synthesized from their phone
-- or user ID (e.g., 'user_' || SUBSTRING(phone, 4, 8)) if strict NOT NULL is applied later.
-- ============================================================================

-- 1. Alter Users Table
ALTER TABLE "users" 
  ALTER COLUMN "phone" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "username" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3);

-- Unique index on lowercase username (enforces case-insensitive uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_lower_idx" ON "users" (LOWER("username"));

-- Unique index on lowercase email (enforces case-insensitive uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_lower_idx" ON "users" (LOWER("email"));

-- 2. Create Email Verifications Table
CREATE TABLE IF NOT EXISTS "email_verifications" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "pending_payload" JSONB,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "email_verifications_email_purpose_idx" ON "email_verifications"("email", "purpose");
CREATE INDEX IF NOT EXISTS "email_verifications_expires_at_idx" ON "email_verifications"("expires_at");

-- 3. Create Auth Rate Limits Table
CREATE TABLE IF NOT EXISTS "auth_rate_limits" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "window_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "last_request_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "auth_rate_limits_key_idx" ON "auth_rate_limits"("key");
CREATE INDEX IF NOT EXISTS "auth_rate_limits_expires_at_idx" ON "auth_rate_limits"("expires_at");
