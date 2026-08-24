-- Drop medical_records table if it exists
DROP TABLE IF EXISTS "medical_records";

-- Drop liveKitRoom column from consultations if it exists
ALTER TABLE "consultations" DROP COLUMN IF EXISTS "liveKitRoom";

-- Drop isOnline column from users if it exists
ALTER TABLE "users" DROP COLUMN IF EXISTS "isOnline";
