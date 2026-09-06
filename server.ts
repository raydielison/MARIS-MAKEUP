import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint da API não encontrado' });
});

app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erro na API:', err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno no servidor' });
});

async function configureFrontend() {
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
}

if (process.env.VERCEL) {
  app.use(express.static(path.join(process.cwd(), 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
} else {
  configureFrontend().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }).catch((error) => {
    console.error('Falha ao iniciar servidor:', error);
    process.exit(1);
  });
}

export default app;
