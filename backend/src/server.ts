import express, { Request, Response } from 'express';
const app = express();

const PORT = Number(process.env.PORT) || 3000;
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use((req: Request, res: Response, next) => {

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  next();

});
app.get('/health', (req: Request, res: Response) => {

res.json({

status: 'ok',

timestamp: new Date().toISOString(),

environment: process.env.NODE_ENV || 'development'

});

});
app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});