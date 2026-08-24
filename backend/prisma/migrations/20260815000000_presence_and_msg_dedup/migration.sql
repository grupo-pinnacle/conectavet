-- Presencia: registramos cuándo estuvo conectado el usuario por última vez,
-- para que el "online" no quede pegado si se cae la conexión (P3-4).
ALTER TABLE "users" ADD COLUMN "last_seen" TIMESTAMP(3);

-- Dedup durable de mensajes: guardamos el id que genera el cliente para
-- descartar reintentos/duplicados aunque se pierda la memoria del proceso (P3-6).
ALTER TABLE "messages" ADD COLUMN "client_msg_id" TEXT;
CREATE UNIQUE INDEX "messages_client_msg_id_key" ON "messages"("client_msg_id");
