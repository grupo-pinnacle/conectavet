-- AlterEnum
ALTER TYPE "ConsultationStatus" ADD VALUE 'PENDING';

-- DropForeignKey
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_vetId_fkey";

-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN     "dosage" TEXT,
ADD COLUMN     "durationDays" TEXT,
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "indications" TEXT,
ADD COLUMN     "medication" TEXT;

-- CreateIndex
CREATE INDEX "consultations_clientId_idx" ON "consultations"("clientId");

-- CreateIndex
CREATE INDEX "consultations_vetId_idx" ON "consultations"("vetId");

-- CreateIndex
CREATE INDEX "consultations_status_idx" ON "consultations"("status");

-- CreateIndex
CREATE INDEX "pets_ownerId_idx" ON "pets"("ownerId");

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
