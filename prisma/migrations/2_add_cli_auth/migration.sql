CREATE TABLE "cli_auth_requests" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "user_code" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "user_id" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "approved_at" TIMESTAMP(3),
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "cli_auth_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cli_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT,
  "token_hash" TEXT NOT NULL,
  "last_used_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "cli_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cli_auth_requests_code_key" ON "cli_auth_requests"("code");
CREATE UNIQUE INDEX "cli_auth_requests_user_code_key" ON "cli_auth_requests"("user_code");
CREATE INDEX "cli_auth_requests_status_expires_at_idx" ON "cli_auth_requests"("status", "expires_at");
CREATE INDEX "cli_auth_requests_user_id_created_at_idx" ON "cli_auth_requests"("user_id", "created_at");

CREATE UNIQUE INDEX "cli_tokens_token_hash_key" ON "cli_tokens"("token_hash");
CREATE INDEX "cli_tokens_user_id_created_at_idx" ON "cli_tokens"("user_id", "created_at");
CREATE INDEX "cli_tokens_user_id_revoked_at_idx" ON "cli_tokens"("user_id", "revoked_at");

ALTER TABLE "cli_auth_requests"
ADD CONSTRAINT "cli_auth_requests_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cli_tokens"
ADD CONSTRAINT "cli_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
