-- AlterTable
ALTER TABLE "users" ADD COLUMN "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "email_verify_token" TEXT,
ADD COLUMN "email_verify_expires" TIMESTAMP(3),
ADD COLUMN "password_reset_token" TEXT,
ADD COLUMN "password_reset_expires" TIMESTAMP(3);
