import express from 'express';
import path from 'node:path';
import { apiRouter } from './server/api.ts';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erro na API:', err);
  res.status(err?.status || 500).json({ error: err?.message || 'Erro interno no servidor' });
});

const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint da API não encontrado' });
  }
  return res.sendFile(path.join(distPath, 'index.html'), (error) => {
    if (error) next(error);
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
