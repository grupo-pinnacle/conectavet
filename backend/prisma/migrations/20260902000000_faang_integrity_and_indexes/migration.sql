-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rating_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "diagnosis_notes" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_role_isOnline_vet_status_deleted_at_idx" ON "users"("role", "isOnline", "vet_status", "deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pets_ownerId_deletedAt_idx" ON "pets"("ownerId", "deletedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "consultations_clientId_status_deleted_at_idx" ON "consultations"("clientId", "status", "deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "consultations_vetId_status_deleted_at_idx" ON "consultations"("vetId", "status", "deleted_at");
