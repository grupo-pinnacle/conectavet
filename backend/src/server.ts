import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
https://github.com/grupo-pinnacle/conectavet/pull/3/conflict?name=backend%252Ftsconfig.json&base_oid=8581f69ec7991b9b34f221fb4b94c7d278cab8d5&head_oid=e2cf5a6140d9f82fa94390b7497e661b5a826a31
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});