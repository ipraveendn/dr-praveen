CREATE TABLE IF NOT EXISTS "RefreshSession" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "username" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(6) NOT NULL,
  "revokedAt" TIMESTAMP(6),
  "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "idx_refresh_session_user_active" ON "RefreshSession"("username", "revokedAt", "expiresAt");
CREATE INDEX IF NOT EXISTS "idx_token_queue_next" ON "Token"("clinicId", "status", "appointmentDate", "tokenNumber");
