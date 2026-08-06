-- Session revocation: logout increments tokenVersion so all previously issued JWTs become invalid.
ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 1;
