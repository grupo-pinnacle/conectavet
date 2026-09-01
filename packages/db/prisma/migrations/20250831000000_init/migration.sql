-- =============================================================================
-- ConectaVet — Initial schema (T3 / Next.js)
-- =============================================================================
-- Generado condensando las 11 migraciones del proyecto Express anterior
-- (ConectaVet/backend/prisma/migrations/) en una sola init limpia que matchea
-- el schema.prisma actual de packages/db/prisma/schema.prisma.
--
-- APLICAR:
--   1. Local:
--        psql "$DATABASE_URL" -f init.sql
--   2. Supabase: SQL Editor → New query → pegar todo este archivo → Run
--   3. Producción: NO aplicar este archivo. Usar Prisma:
--        pnpm --filter @conectavet/db db:migrate --name init   (dev)
--        pnpm --filter @conectavet/db db:migrate:deploy         (prod)
--
-- TABLAS CREADAS (11):
--   users, pets, consultations, messages, prescriptions, attachments,
--   push_tokens, notifications, reviews, favorite_vets
-- (+ _prisma_migrations se crea solo al usar prisma migrate)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE "Role" AS ENUM ('CLIENT', 'VET', 'ADMIN');

CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

CREATE TYPE "ConsultationStatus" AS ENUM ('WAITING', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TYPE "VetStatus" AS ENUM ('PENDING', 'APPROVED');


-- =============================================================================
-- TABLES
-- =============================================================================

-- USERS ---------------------------------------------------------------------

CREATE TABLE "users" (
    "id"                     TEXT NOT NULL,
    "email"                  TEXT NOT NULL,
    "password"               TEXT NOT NULL,
    "firstName"              TEXT,
    "lastName"               TEXT,
    "phone"                  TEXT,
    "bio"                    TEXT,
    "specialty"              TEXT,
    "role"                   "Role" NOT NULL DEFAULT 'CLIENT',
    "vet_status"             "VetStatus" NOT NULL DEFAULT 'PENDING',
    "is_online"              BOOLEAN NOT NULL DEFAULT false,
    "token_version"          INTEGER NOT NULL DEFAULT 1,
    "is_email_verified"      BOOLEAN NOT NULL DEFAULT false,
    "email_verify_token"     TEXT,
    "email_verify_expires"   TIMESTAMP(3),
    "password_reset_token"   TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "last_seen"              TIMESTAMP(3),
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");


-- PETS ----------------------------------------------------------------------

CREATE TABLE "pets" (
    "id"                  TEXT NOT NULL,
    "name"                TEXT NOT NULL,
    "species"             TEXT NOT NULL,
    "breed"               TEXT,
    "age"                 INTEGER,
    "weight"              DOUBLE PRECISION,
    "photoUrl"            TEXT,
    "ownerId"             TEXT NOT NULL,
    "deleted_at"          TIMESTAMP(3),
    "weightKg"            DOUBLE PRECISION,
    "sex"                 "Sex",
    "color"               TEXT,
    "microchip"           TEXT,
    "allergies"           TEXT[],
    "chronicConditions"   TEXT[],
    "birthDate"           TIMESTAMP(3),
    "is_deceased"         BOOLEAN NOT NULL DEFAULT false,
    "death_date"          TIMESTAMP(3),
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pets_ownerId_idx" ON "pets"("ownerId");
CREATE INDEX "pets_species_idx" ON "pets"("species");


-- CONSULTATIONS -------------------------------------------------------------

CREATE TABLE "consultations" (
    "id"         TEXT NOT NULL,
    "clientId"   TEXT NOT NULL,
    "vetId"      TEXT,
    "petId"      TEXT NOT NULL,
    "status"     "ConsultationStatus" NOT NULL DEFAULT 'WAITING',
    "reason"     TEXT,
    "notes"      TEXT,
    "startedAt"  TIMESTAMP(3),
    "endedAt"    TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consultations_clientId_idx" ON "consultations"("clientId");
CREATE INDEX "consultations_vetId_idx" ON "consultations"("vetId");
CREATE INDEX "consultations_status_idx" ON "consultations"("status");
CREATE INDEX "consultations_deleted_at_idx" ON "consultations"("deleted_at");


-- MESSAGES ------------------------------------------------------------------

CREATE TABLE "messages" (
    "id"             TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "senderId"       TEXT NOT NULL,
    "content"        TEXT NOT NULL,
    "attachment_url" TEXT,
    "client_msg_id"  TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"      TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messages_client_msg_id_key" ON "messages"("client_msg_id");
CREATE INDEX "messages_consultationId_createdAt_idx" ON "messages"("consultationId", "createdAt");
CREATE INDEX "messages_deletedAt_idx" ON "messages"("deletedAt");


-- PRESCRIPTIONS -------------------------------------------------------------

CREATE TABLE "prescriptions" (
    "id"             TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "vetId"          TEXT NOT NULL,
    "content"        TEXT NOT NULL,
    "medication"     TEXT,
    "dosage"         TEXT,
    "frequency"      TEXT,
    "duration_days"  TEXT,
    "indications"    TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prescriptions_consultationId_idx" ON "prescriptions"("consultationId");


-- ATTACHMENTS (media) -------------------------------------------------------

CREATE TABLE "attachments" (
    "id"              TEXT NOT NULL,
    "uploaderId"      TEXT NOT NULL,
    "consultation_id" TEXT,
    "public_id"       TEXT NOT NULL,
    "type"            TEXT NOT NULL,
    "url"             TEXT NOT NULL,
    "thumbnail_url"   TEXT,
    "mime_type"       TEXT NOT NULL,
    "size"            INTEGER NOT NULL,
    "width"           INTEGER,
    "height"          INTEGER,
    "format"          TEXT,
    "bytes"           INTEGER,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attachments_public_id_key" ON "attachments"("public_id");
CREATE INDEX "attachments_uploaderId_idx" ON "attachments"("uploaderId");
CREATE INDEX "attachments_consultation_id_idx" ON "attachments"("consultation_id");


-- PUSH TOKENS (mobile notifications) ----------------------------------------

CREATE TABLE "push_tokens" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "platform"  TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");
CREATE INDEX "push_tokens_userId_idx" ON "push_tokens"("userId");


-- NOTIFICATIONS -------------------------------------------------------------

CREATE TABLE "notifications" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "data"      JSONB,
    "read_at"   TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");


-- REVIEWS (rating de consulta) ----------------------------------------------

CREATE TABLE "reviews" (
    "id"             TEXT NOT NULL,
    "rating"         INTEGER NOT NULL,
    "comment"        TEXT,
    "consultationId" TEXT NOT NULL,
    "clientId"       TEXT NOT NULL,
    "vetId"          TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reviews_consultationId_key" ON "reviews"("consultationId");
CREATE INDEX "reviews_vetId_idx" ON "reviews"("vetId");
CREATE INDEX "reviews_clientId_idx" ON "reviews"("clientId");


-- FAVORITE VETS -------------------------------------------------------------

CREATE TABLE "favorite_vets" (
    "id"        TEXT NOT NULL,
    "clientId"  TEXT NOT NULL,
    "vetId"     TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_vets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favorite_vets_clientId_vetId_key" ON "favorite_vets"("clientId", "vetId");
CREATE INDEX "favorite_vets_vetId_idx" ON "favorite_vets"("vetId");


-- =============================================================================
-- FOREIGN KEYS
-- =============================================================================

-- pets.ownerId → users.id (CASCADE delete)
ALTER TABLE "pets"
    ADD CONSTRAINT "pets_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- consultations.clientId → users.id (RESTRICT)
ALTER TABLE "consultations"
    ADD CONSTRAINT "consultations_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- consultations.vetId → users.id (SET NULL — vet puede borrarse sin perder la consulta)
ALTER TABLE "consultations"
    ADD CONSTRAINT "consultations_vetId_fkey"
    FOREIGN KEY ("vetId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- consultations.petId → pets.id (RESTRICT)
ALTER TABLE "consultations"
    ADD CONSTRAINT "consultations_petId_fkey"
    FOREIGN KEY ("petId") REFERENCES "pets"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- messages.consultationId → consultations.id (CASCADE)
ALTER TABLE "messages"
    ADD CONSTRAINT "messages_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "consultations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- messages.senderId → users.id (RESTRICT)
ALTER TABLE "messages"
    ADD CONSTRAINT "messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- prescriptions.consultationId → consultations.id (CASCADE)
ALTER TABLE "prescriptions"
    ADD CONSTRAINT "prescriptions_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "consultations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- prescriptions.vetId → users.id (RESTRICT)
ALTER TABLE "prescriptions"
    ADD CONSTRAINT "prescriptions_vetId_fkey"
    FOREIGN KEY ("vetId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- attachments.uploaderId → users.id (CASCADE)
ALTER TABLE "attachments"
    ADD CONSTRAINT "attachments_uploaderId_fkey"
    FOREIGN KEY ("uploaderId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- attachments.consultation_id → consultations.id (SET NULL — media sobrevive a la consulta)
ALTER TABLE "attachments"
    ADD CONSTRAINT "attachments_consultation_id_fkey"
    FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- push_tokens.userId → users.id (CASCADE)
ALTER TABLE "push_tokens"
    ADD CONSTRAINT "push_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- notifications.userId → users.id (CASCADE)
ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- reviews.consultationId → consultations.id (CASCADE, UNIQUE 1:1)
ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "consultations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- reviews.clientId → users.id (RESTRICT)
ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- reviews.vetId → users.id (RESTRICT)
ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_vetId_fkey"
    FOREIGN KEY ("vetId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- favorite_vets.clientId → users.id (CASCADE)
ALTER TABLE "favorite_vets"
    ADD CONSTRAINT "favorite_vets_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- favorite_vets.vetId → users.id (CASCADE)
ALTER TABLE "favorite_vets"
    ADD CONSTRAINT "favorite_vets_vetId_fkey"
    FOREIGN KEY ("vetId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;


-- =============================================================================
-- AUTO-UPDATE DE updatedAt
-- =============================================================================
-- Prisma actualiza updatedAt en cada write desde la app. Mantenemos triggers
-- a nivel DB para que escrituras manuales (admin, scripts SQL) también lo hagan.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER pets_updated_at
    BEFORE UPDATE ON "pets"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER consultations_updated_at
    BEFORE UPDATE ON "consultations"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER prescriptions_updated_at
    BEFORE UPDATE ON "prescriptions"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- TRIGGER: vets auto-aprobados si estaban PENDING al registrarse por CLIENT
-- =============================================================================
-- (Ya está en la lógica de negocio — este trigger es solo safety net.)
-- Cuando un user con role=VET se inserta, su vetStatus es PENDING por default.
-- Un admin lo actualiza a APPROVED manualmente. No hay trigger que lo haga auto.

COMMIT;


-- =============================================================================
-- POST-MIGRATION: SUPABASE REALTIME (OPCIONAL)
-- =============================================================================
-- Si vas a usar Supabase Realtime para chat/notificaciones en tiempo real,
-- ejecutá estas líneas DESPUÉS del COMMIT:

-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE consultations;

-- Y para que UPDATE/DELETE se propaguen correctamente:
-- ALTER TABLE messages REPLICA IDENTITY FULL;
-- ALTER TABLE notifications REPLICA IDENTITY FULL;
-- ALTER TABLE consultations REPLICA IDENTITY DEFAULT;
-- ALTER TABLE pets REPLICA IDENTITY DEFAULT;
-- ALTER TABLE users REPLICA IDENTITY DEFAULT;


-- =============================================================================
-- POST-MIGRATION: ROW LEVEL SECURITY (OPCIONAL PERO RECOMENDADO)
-- =============================================================================
-- Habilitar RLS protege contra accesos directos a la DB que evadan el backend.
-- La app SIEMPRE debe pasar por el backend (tRPC), no por la anon key de Supabase.
-- Estas políticas reflejan las reglas de negocio del tRPC.

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE favorite_vets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Policies (ejemplo para users):
-- CREATE POLICY "Users can read their own profile" ON users
--     FOR SELECT USING (auth.uid()::text = id);
-- CREATE POLICY "Users can update their own profile" ON users
--     FOR UPDATE USING (auth.uid()::text = id);

-- CREATE POLICY "Users can read their own pets" ON pets
--     FOR SELECT USING (auth.uid()::text = "ownerId");
-- CREATE POLICY "Users can manage their own pets" ON pets
--     FOR ALL USING (auth.uid()::text = "ownerId");

-- CREATE POLICY "Clients see own consultations" ON consultations
--     FOR SELECT USING (auth.uid()::text = "clientId");
-- CREATE POLICY "Vets see assigned consultations" ON consultations
--     FOR SELECT USING (auth.uid()::text = "vetId");


-- =============================================================================
-- SEED DATA (OPCIONAL)
-- =============================================================================
-- Descomentar para crear un admin y un vet demo.
-- El hash bcrypt de "admin123" es: $2a$10$rBV2JDeWW3.vKyeQcM8fFOz4Y7kF5T2N3N5N5N5N5N5N5N5N5N5N5
-- (Generar el real con: node -e "console.log(require('bcryptjs').hashSync('TuPassword',10))")

-- INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "role", "vet_status")
-- VALUES
--   ('seed_admin_001',     'admin@conectavet.com',   '$2a$10$...', 'Admin', 'Root',    'ADMIN', 'APPROVED'),
--   ('seed_vet_001',       'vet@conectavet.com',     '$2a$10$...', 'Dra.', 'Pinnacle', 'VET',   'APPROVED'),
--   ('seed_vet_002',       'vet2@conectavet.com',    '$2a$10$...', 'Dr.',  'García',  'VET',   'PENDING'),
--   ('seed_client_001',    'cliente@conectavet.com', '$2a$10$...', 'Juan', 'Pérez',   'CLIENT','APPROVED');


-- =============================================================================
-- VERIFICACIÓN POST-MIGRATION
-- =============================================================================
-- Confirmar que todo se creó correctamente:
--
--   SELECT
--       t.table_name,
--       (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS columns
--   FROM information_schema.tables t
--   WHERE t.table_schema = 'public'
--   ORDER BY t.table_name;
--
-- Debería devolver 10 tablas (más _prisma_migrations si usás Prisma migrate):
--   attachments, consultations, favorite_vets, messages, notifications,
--   pets, prescriptions, push_tokens, reviews, users
--
-- Y los 4 enums:
--
--   SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
--   FROM pg_type t
--   JOIN pg_enum e ON t.oid = e.enumtypid
--   JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
--   WHERE n.nspname = 'public'
--   GROUP BY t.typname
--   ORDER BY t.typname;
--
-- Debería devolver: ConsultationStatus (5), Role (3), Sex (2), VetStatus (2)
-- =============================================================================