const fs = require('fs');
let content = fs.readFileSync('backend/src/app.ts', 'utf-8');
content = content.replace(
  /const limiter = rateLimit\(\{[\s\S]*?\}\);/g,
  `const isTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
const limiter = rateLimit({
  store: new CustomRedisStore('rl:global:'),
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || isTest,
  message: { success: false, message: 'Demasiadas solicitudes, intentá de nuevo más tarde' },
});`
);
content = content.replace(
  /const authLimiter = rateLimit\(\{[\s\S]*?\}\);/g,
  `const authLimiter = rateLimit({
  store: new CustomRedisStore('rl:auth:'),
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { success: false, message: 'Demasiados intentos de login, intentá de nuevo más tarde' },
});`
);
content = content.replace(
  /const callsLimiter = rateLimit\(\{[\s\S]*?\}\);/g,
  `const callsLimiter = rateLimit({
  store: new CustomRedisStore('rl:calls:'),
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { success: false, message: 'Demasiadas solicitudes de llamada, intentá de nuevo más tarde' },
});`
);
fs.writeFileSync('backend/src/app.ts', content, 'utf-8');
