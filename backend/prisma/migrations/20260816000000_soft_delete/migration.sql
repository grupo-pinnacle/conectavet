-- AlterTable: soft delete en Consultation
ALTER TABLE "consultations" ADD COLUMN "deleted_at" TIMESTAMP(3);
CREATE INDEX "consultations_deletedAt_idx" ON "consultations"("deleted_at");

-- AlterTable: soft delete en Message
ALTER TABLE "messages" ADD COLUMN "deleted_at" TIMESTAMP(3);
CREATE INDEX "messages_deletedAt_idx" ON "messages"("deleted_at");
