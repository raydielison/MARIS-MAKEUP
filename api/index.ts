import express from 'express';
import { apiRouter } from '../server/api.ts';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint da API não encontrado' });
});

export default app;
