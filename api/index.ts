import express from 'express';
import { apiRouter } from '../server/api.ts';

const app = express();

app.use(express.json({ limit: '10mb' }));

// API routes are exposed directly as a Vercel serverless function.
app.use('/', apiRouter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
