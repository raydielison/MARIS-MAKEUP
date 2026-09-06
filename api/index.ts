import express from 'express';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Load the API router from the bundled project without a runtime .ts import.
let routerPromise: Promise<any> | null = null;

async function loadRouter() {
  if (!routerPromise) {
    routerPromise = import('../server/api.js').catch(async (error) => {
      // Vercel's Node bundler may preserve the TypeScript source extension.
      // Try the source path only as a fallback for local/alternate bundlers.
      try {
        return await import('../server/api.ts');
      } catch {
        throw error;
      }
    });
  }
  return routerPromise;
}

app.use('/api', async (req, res, next) => {
  try {
    const module = await loadRouter();
    const router = module.apiRouter ?? module.default;
    if (!router) throw new Error('API router não foi exportado por server/api.');
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
