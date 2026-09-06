import express from 'express';

const app = express();
app.use(express.json({ limit: '10mb' }));

let routerPromise: Promise<any> | null = null;

async function loadRouter() {
  if (!routerPromise) {
    routerPromise = import('../server/api.ts').then((module) => module.apiRouter ?? module.default);
  }
  return routerPromise;
}

app.use('/api', async (req, res, next) => {
  try {
    const router = await loadRouter();
    return router(req, res, next);
  } catch (error: any) {
    console.error('Falha ao carregar a API:', error);
    return res.status(500).json({
      error: error?.message || 'Falha ao carregar a API',
      code: error?.code || 'API_LOAD_ERROR',
    });
  }
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'MARIS MAKEUP API' });
});

export default app;
