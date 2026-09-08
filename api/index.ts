import express from 'express';
import { apiRouter } from '../server/api';

const app = express();

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MARIS MAKEUP API', timestamp: new Date().toISOString() });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MARIS MAKEUP API', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'MARIS MAKEUP API' });
});

// Support both /api/* and root mount in case of Vercel path rewrites
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Express error handler for API
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erro na API Vercel:', err);
  res.status(err?.status || 500).json({ error: err?.message || 'Erro interno no servidor' });
});

export default app;

