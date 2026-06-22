# VetConnect Backend

Servidor de la plataforma VetConnect.

## Requisitos

- Node.js 18 o superior
- PostgreSQL corriendo localmente

## Instalación

1. Clonar el repositorio
2. Entrar a la carpeta `backend`
3. Correr `npm install`
4. Copiar `.env.example` a `.env` con `cp .env.example .env`
5. Editar `.env` con tus valores reales (contraseña de PostgreSQL, etc.)
6. Asegurarse de tener PostgreSQL corriendo y la base de datos `vetconnect` creada
7. Correr `npx prisma migrate dev` para crear las tablas
8. Correr `npm run dev` para levantar el servidor

## Scripts

- `npm run dev` — levanta el servidor en modo desarrollo con hot reload
- `npm run build` — compila TypeScript a JavaScript
- `npm start` — corre la versión compilada