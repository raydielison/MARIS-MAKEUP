import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard middlewares
  app.use(express.json({ limit: '10mb' }));

  // API routes FIRST
  app.use('/api', apiRouter);

  // Healthcheck endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Catch-all 404 for any unhandled /api route so it never returns HTML to frontend API calls
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Endpoint da API não encontrado' });
  });

  // Express error handler for API
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Erro na API:', err);
    res.status(err.status || 500).json({ error: err.message || 'Erro interno no servidor' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
