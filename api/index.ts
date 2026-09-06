import express from 'express';
import { apiRouter } from '../server/api.ts';

const app = express();

app.use(express.json({ limit: '10mb' }));

// Vercel may invoke this function with the /api prefix still present.
// Mounting the router in both forms makes /api/auth/login and /auth/login
// work regardless of how the serverless function normalizes the URL.
app.use('/', apiRouter);
app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
