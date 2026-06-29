# Railway Deploy — Backend VetConnect
#
# 1. Ir a https://railway.app → New Project → Deploy from repo
# 2. Elegir el repo grupo-pinnacle/conectavet
# 3. Root Directory: backend
# 4. Railway detecta automáticamente Node.js y usa:
#    npm ci → npx prisma generate → npx tsc → node dist/server.js
#
# Variables de entorno a configurar en Railway:
#
# DATABASE_URL=postgresql://postgres.lgdaobhyhnoxznwhqtot:wfEAMXp9c2fVqj37@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
# DIRECT_URL=postgresql://postgres.lgdaobhyhnoxznwhqtot:wfEAMXp9c2fVqj37@aws-1-us-west-2.pooler.supabase.com:5432/postgres
# JWT_SECRET=una-clave-secreta-bien-larga-que-nadie-pueda-adivinar-vetconnect-2025
# NODE_ENV=production
# PORT=3000
#
# 5. Railway asigna una URL tipo: https://conectavet-api.up.railway.app
# 6. Probar: curl https://conectavet-api.up.railway.app/health

Write-Host "Para deployar:"
Write-Host "1. Push a main: git push origin main"
Write-Host "2. Ir a https://railway.app"
Write-Host "3. New Project → Deploy from GitHub → elegir conectavet"
Write-Host "4. Root directory: backend"
Write-Host "5. Agregar variables de entorno (ver .env.example)"
Write-Host "6. Railway deploya automáticamente"
