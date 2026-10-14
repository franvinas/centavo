-- Safe for existing deployments where timezone was added through db push.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" TEXT;
CREATE TABLE "rate_limits" ("key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL, "expires_at" TIMESTAMPTZ NOT NULL);
CREATE INDEX "rate_limits_expiry" ON "rate_limits" ("expires_at");
CREATE TABLE "telegram_updates" ("id" BIGINT PRIMARY KEY, "status" TEXT NOT NULL DEFAULT 'pending', "lease_until" TIMESTAMP(3), "responses" JSONB NOT NULL DEFAULT '[]', "completed_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "telegram_tool_receipts" ("key" TEXT PRIMARY KEY, "update_id" BIGINT NOT NULL REFERENCES "telegram_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE, "result" TEXT NOT NULL);
