-- Add vet approval status expected by schema.prisma
CREATE TYPE "VetStatus" AS ENUM ('PENDING', 'APPROVED');

ALTER TABLE "users"
ADD COLUMN "vet_status" "VetStatus" NOT NULL DEFAULT 'APPROVED';
